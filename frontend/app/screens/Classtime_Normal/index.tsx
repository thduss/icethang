import React, { useEffect, useState, useRef } from "react"
import { Text, View, StyleSheet, ActivityIndicator } from "react-native"
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor, OutputOrientation } from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite'; 
import * as ScreenOrientation from 'expo-screen-orientation';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useSharedValue, Worklets } from 'react-native-worklets-core';
import { useRouter } from "expo-router";
import ClassProgressBar from "../../components/ClassProgressBar"
import AlertButton, { AlertButtonRef } from "../../components/AlertButton"
import TrafficLight from "../../components/TrafficLight";
import CalibrationModal from "../../components/Calibration"
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { SOCKET_CONFIG } from "../../api/socket";
import { useSelector } from "react-redux";
import { RootState } from "../../store/stores";

type AIStatus = "FOCUSED" | "BLINKING" | "MOVING" | "GAZE OFF" | "SLEEPING" | "AWAY" | "RESTROOM" | "ACTIVITY" | "UNFOCUS"
type ClassMode = "NORMAL" | "DIGITAL";  

// === [설정] ===
const YAW_THRESHOLD = 0.25;
const EAR_THRESHOLD = 0.08;
const MOVEMENT_THRESHOLD = 20;
const AWAY_FRAME_LIMIT = 100;

const IDX = {
  LEFT_EYE: [159, 145, 33, 133],
  RIGHT_EYE: [386, 374, 362, 263],
  FACE_EDGES: [234, 454],
  NOSE_TIP: 1
};

const STATUS_MAP = {
  0: "FOCUSED",
  1: "MOVING",
  2: "AWAY",
  3: "UNFOCUS",
  4: "SLEEPING",
  5: "GAZE OFF"
} as const;

interface StudentInfo {
  id: number;
  name: string;
  classId: number;
}

export default function NormalClassScreen() {
  const router = useRouter();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  
  const model = useTensorflowModel(require('../../../assets/face_landmarker.tflite'));
  const { resize } = useResizePlugin();

  const [aiStatus, setAiStatus] = useState<AIStatus>("FOCUSED");
  const [studentCount, setStudentCount] = useState(0);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [currentMode, setCurrentMode] = useState<ClassMode>("NORMAL");
  const [isCameraActive, setIsCameraActive] = useState(true);

  const lastNoseX = useSharedValue(0);
  const lastNoseY = useSharedValue(0);
  const movementScore = useSharedValue(0);
  const faceMissingCount = useSharedValue(0);
  const frameCounter = useSharedValue(0);

  const lastAlertTime = useRef(0);
  const stompClient = useRef<Client | null>(null);
  const alertRef = useRef<AlertButtonRef>(null);

  const studentData = useSelector((state: RootState) => state.auth.studentData);
  const classId = studentData?.classId?.toString() || "1";
  const studentInfo: StudentInfo = {
    id: studentData?.studentId || 4,
    name: studentData?.studentName || "김싸피",
    classId: studentData?.classId || 1,
  };

  const logDebug = Worklets.createRunOnJS((message: string, data?: any) => {
    if (data !== undefined) {
      console.log(`🔍 [AI Debug] ${message}:`, data);
    } else {
      console.log(`🔍 [AI Debug] ${message}`);
    }
  });

  const handleStudentStatusReport = (status: string) => {
    console.log(`📥 [학생 보고] 받은 상태: ${status}`);
    
    const displayStatus = (status === 'RESTROOM' || status === 'ACTIVITY') ? 'FOCUSED' : status;
    setAiStatus(displayStatus as AIStatus);
    
    if (isSocketConnected && stompClient.current) {
      const payload = {
        classid: parseInt(classId),
        studentld: studentInfo.id,
        studentName: studentInfo.name,
        type: status,
        detectedAt: new Date().toISOString()
      };
      
      console.log('📤 [학생 보고 전송]:', payload);
      stompClient.current.publish({ 
        destination: SOCKET_CONFIG.PUBLISH.ALERT, 
        body: JSON.stringify(payload) 
      });
    }
  };
  
  const handleStatusChange = Worklets.createRunOnJS((newStatusCode: number) => {
    const statusText = STATUS_MAP[newStatusCode as keyof typeof STATUS_MAP] || "FOCUSED";
    console.log(`🎯 [Status Change] ${newStatusCode} -> ${statusText}`);
    
    setAiStatus(statusText as AIStatus);
    console.log(`✅ [Status Updated] -> ${statusText}`);
  });

  // ✅ Mode 변경 처리 함수 (카메라 비활성화 후 전환)
  const handleModeChange = (newMode: ClassMode) => {
    console.log(`🔄 [Mode Change] ${currentMode} -> ${newMode}`);
    setCurrentMode(newMode);
    
    // ✅ 1. 먼저 현재 카메라 비활성화
    console.log('📷 [Camera] 카메라 비활성화 중...');
    setIsCameraActive(false);
    
    // ✅ 2. 카메라 정리 시간을 준 후 화면 전환 (300ms)
    setTimeout(() => {
      if (newMode === "NORMAL") {
        console.log('🎯 [Navigation] NORMAL 수업으로 이동');
        router.replace("/screens/Classtime_Normal");
      } else if (newMode === "DIGITAL") {
        console.log('🎯 [Navigation] DIGITAL 수업으로 이동');
        router.replace("/screens/Classtime_Digital");
      }
    }, 300);
  };

  useEffect(() => { if (!hasPermission) requestPermission(); }, [hasPermission]);

  useEffect(() => {
    async function lockOrientation() {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    }
    lockOrientation();

    return () => {
      ScreenOrientation.unlockAsync(); 
    };
  }, []);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (model.state !== 'loaded') return;

    frameCounter.value += 1;
    if (frameCounter.value % 3 !== 0) return;

    const shouldDetailLog = frameCounter.value % 300 === 0;

    const resized = resize(frame, {
      scale: { width: 192, height: 192 },
      pixelFormat: 'rgb',
      dataType: 'float32',
    });

    if (shouldDetailLog) {
      logDebug('Processing frame', frameCounter.value);
    }

    try {
      const outputs = model.model.runSync([resized]);
      
      if (outputs && outputs.length > 0) {
        const landmarks = outputs[0] as Float32Array;

        if (shouldDetailLog) {
          logDebug('Landmarks length', landmarks.length);
        }

        if (landmarks.length < 100) {
          faceMissingCount.value += 1;
          if (shouldDetailLog) {
            logDebug('Face missing', faceMissingCount.value);
          }
          if (faceMissingCount.value > AWAY_FRAME_LIMIT) {
            logDebug('AWAY - face missing for extended period');
            handleStatusChange(2);
          }
          return;
        }

        faceMissingCount.value = 0;
        
        const noseX = landmarks[IDX.NOSE_TIP * 3];
        const noseY = landmarks[IDX.NOSE_TIP * 3 + 1];

        if (shouldDetailLog) {
          logDebug('Nose position', { 
            x: noseX.toFixed(3), 
            y: noseY.toFixed(3) 
          });
        }

        const diff = Math.abs(noseX - lastNoseX.value) + Math.abs(noseY - lastNoseY.value);
        lastNoseX.value = noseX;
        lastNoseY.value = noseY;

        if (diff > 2) {
          movementScore.value = Math.min(MOVEMENT_THRESHOLD + 10, movementScore.value + 1.5);
          if (shouldDetailLog) {
            logDebug('Movement detected', `diff=${diff.toFixed(3)}, score=${movementScore.value.toFixed(1)}`);
          }
        } else {
          movementScore.value = Math.max(0, movementScore.value - 0.5);
        }

        const isMovingTooMuch = movementScore.value > MOVEMENT_THRESHOLD;

        const calculateEAR = (indices: number[]) => {
          'worklet';
          const p0x = landmarks[indices[0] * 3];
          const p0y = landmarks[indices[0] * 3 + 1];
          const p1x = landmarks[indices[1] * 3];
          const p1y = landmarks[indices[1] * 3 + 1];
          const p2x = landmarks[indices[2] * 3];
          const p2y = landmarks[indices[2] * 3 + 1];
          const p3x = landmarks[indices[3] * 3];
          const p3y = landmarks[indices[3] * 3 + 1];

          const vertical = Math.sqrt(Math.pow(p0x - p1x, 2) + Math.pow(p0y - p1y, 2));
          const horizontal = Math.sqrt(Math.pow(p2x - p3x, 2) + Math.pow(p2y - p3y, 2));
          
          return vertical / horizontal;
        };

        const leftEAR = calculateEAR(IDX.LEFT_EYE);
        const rightEAR = calculateEAR(IDX.RIGHT_EYE);
        const avgEAR = (leftEAR + rightEAR) / 2;
        const isSleeping = avgEAR < EAR_THRESHOLD;

        if (shouldDetailLog) {
          logDebug('EAR values', {
            left: leftEAR.toFixed(3),
            right: rightEAR.toFixed(3),
            avg: avgEAR.toFixed(3),
            sleeping: isSleeping
          });
        }

        const leftEdgeX = landmarks[IDX.FACE_EDGES[0] * 3];
        const rightEdgeX = landmarks[IDX.FACE_EDGES[1] * 3];
        const faceWidth = Math.abs(rightEdgeX - leftEdgeX);
        const yawRatio = (noseX - leftEdgeX) / faceWidth;
        const isLookingAway = Math.abs(yawRatio - 0.5) > YAW_THRESHOLD;

        if (shouldDetailLog) {
          logDebug('Gaze tracking', {
            yawRatio: yawRatio.toFixed(3),
            lookingAway: isLookingAway,
            faceWidth: faceWidth.toFixed(2)
          });
        }

        let currentStatus = 0;

        if (isSleeping) {
          currentStatus = 4;
          logDebug('Status: SLEEPING detected');
        } else if (isLookingAway) {
          currentStatus = 5;
          logDebug('Status: GAZE OFF detected');
        } else if (isMovingTooMuch) {
          currentStatus = 1;
          logDebug('Status: MOVING detected');
        }

        if (shouldDetailLog) {
          logDebug('Final status', {
            code: currentStatus,
            movementScore: movementScore.value.toFixed(1),
            sleeping: isSleeping,
            gazeOff: isLookingAway
          });
        }
        
        handleStatusChange(currentStatus);

      } else {
        if (shouldDetailLog) {
          logDebug('No outputs', 'Model returned empty');
        }
      }

    } catch (e: any) { 
      logDebug('Frame error', e?.message);
    }
  }, [model]);

  const sendStatusToServer = (status: AIStatus) => {
    if (!isSocketConnected || !stompClient.current) {
      console.log('⚠️ [Server] Socket not connected');
      return;
    }
    const now = Date.now();
    if (status !== "FOCUSED" && (now - lastAlertTime.current < 3000)) {
      console.log('⚠️ [Server] Throttled');
      return;
    }
    if (status !== "FOCUSED") lastAlertTime.current = now;

    let serverType = status === "FOCUSED" ? "FOCUS" : status === "AWAY" ? "AWAY" : "UNFOCUS";

    const payload = {
      classid: parseInt(classId),
      studentld: studentInfo.id,
      studentName: studentInfo.name,
      type: serverType,
      detectedAt: new Date().toISOString()
    };
    
    console.log('📤 [Server] Sending:', payload);
    stompClient.current.publish({ 
      destination: SOCKET_CONFIG.PUBLISH.ALERT, 
      body: JSON.stringify(payload) 
    });
  };

  useEffect(() => {
    console.log(`🔄 [Effect] status=${aiStatus}, connected=${isSocketConnected}`);
    if (isSocketConnected && aiStatus !== "FOCUSED" && aiStatus !== "RESTROOM" && aiStatus !== "ACTIVITY") {
      sendStatusToServer(aiStatus);
      alertRef.current?.triggerAlert(aiStatus);
    }
  }, [aiStatus, isSocketConnected]);

  // ✅ 소켓 연결 및 구독 설정
  useEffect(() => {
    console.log('🔌 [Socket] Initializing...');
    
    const client = new Client({
      webSocketFactory: () => new SockJS(SOCKET_CONFIG.BROKER_URL),
      reconnectDelay: SOCKET_CONFIG.RECONNECT_DELAY,
      heartbeatIncoming: SOCKET_CONFIG.HEARTBEAT,
      heartbeatOutgoing: SOCKET_CONFIG.HEARTBEAT,
      
      debug: (str) => {
        console.log('🔧 [STOMP Debug]:', str);
      },
      
      onConnect: () => {
        console.log('✅ [Socket] Connected!');
        setIsSocketConnected(true);
        setStudentCount(1); // ✅ 최소 자기 자신 1명
        
        console.log('📡 [Socket] 구독 설정 시작...');
        
        // ✅ 구독 주소 확인
        const studentCountTopic = SOCKET_CONFIG.SUBSCRIBE.STUDENT_COUNT(classId);
        console.log('🔍 [Socket] 접속자 수 구독 주소:', studentCountTopic);
        
        // ✅ 접속자 수 구독 - 더 넓은 파싱
        client.subscribe(
          studentCountTopic, 
          (msg) => {
            console.log('📥 [Socket] ===== 접속자 수 메시지 수신 =====');
            console.log('📥 [Socket] Raw count message:', msg.body);
            console.log('📥 [Socket] Message headers:', msg.headers);
            
            try {
              const data = JSON.parse(msg.body);
              console.log('📥 [Socket] 파싱된 전체 데이터:', JSON.stringify(data, null, 2));
              
              // ✅ 여러 형식 모두 지원
              let count = 0;
              
              if (data.type === "USER_COUNT" && data.count !== undefined) {
                count = data.count;
                console.log('📥 [Socket] ✅ USER_COUNT 타입:', count);
              } else if (data.studentCount !== undefined) {
                count = data.studentCount;
                console.log('📥 [Socket] ✅ studentCount 필드:', count);
              } else if (data.userCount !== undefined) {
                count = data.userCount;
                console.log('📥 [Socket] ✅ userCount 필드:', count);
              } else if (data.count !== undefined) {
                count = data.count;
                console.log('📥 [Socket] ✅ count 필드:', count);
              } else if (typeof data === 'number') {
                count = data;
                console.log('📥 [Socket] ✅ 숫자 직접:', count);
              } else {
                console.warn('⚠️ [Socket] 알 수 없는 형식:', data);
              }
              
              console.log('📥 [Socket] 최종 접속자 수 업데이트:', count);
              setStudentCount(count);
              
            } catch (e) {
              console.error('❌ [Socket] 접속자 수 파싱 오류:', e);
              console.error('❌ [Socket] 원본 메시지:', msg.body);
              
              // ✅ JSON 파싱 실패 시 숫자만 추출
              const numberMatch = msg.body.match(/\d+/);
              if (numberMatch) {
                const count = parseInt(numberMatch[0]);
                console.log('📥 [Socket] 숫자 추출 성공:', count);
                setStudentCount(count);
              }
            }
          }
        );
        console.log('✅ [Socket] 접속자 수 구독 완료:', studentCountTopic);
        
        // 선생님 반 알림 구독
        const alertTopic = SOCKET_CONFIG.SUBSCRIBE.CLASS_TOPIC(classId);
        console.log('🔍 [Socket] 알림 구독 주소:', alertTopic);
        
        client.subscribe(
          alertTopic, 
          (msg) => {
            console.log('📥 [Socket] Raw alert message:', msg.body);
            try {
              const alert = JSON.parse(msg.body);
              console.log('📥 [Socket] 선생님 알림:', alert);
            } catch (e) {
              console.error('❌ [Socket] 알림 파싱 오류:', e);
            }
          }
        );
        console.log('✅ [Socket] 알림 구독 완료:', alertTopic);

        // ✅ 모드 변경 구독
        const modeTopic = SOCKET_CONFIG.SUBSCRIBE.MODE_STATUS(classId);
        console.log('🔍 [Socket] 모드 구독 주소:', modeTopic);
        
        client.subscribe(
          modeTopic, 
          (msg) => {
            console.log('📥 [Socket] Raw mode message:', msg.body);
            try {
              const data = JSON.parse(msg.body);
              const mode = data.mode?.toUpperCase() as ClassMode;
              console.log('📥 [Socket] 모드 변경 수신:', mode, '| 전체 데이터:', data);
              
              if (mode === "NORMAL" || mode === "DIGITAL") {
                handleModeChange(mode);
              } else {
                console.warn('⚠️ [Socket] 알 수 없는 모드:', data);
              }
            } catch (e) {
              console.error('❌ [Socket] 모드 파싱 오류:', e);
            }
          }
        );
        console.log('✅ [Socket] 모드 구독 완료:', modeTopic);

        // ✅ 구독 완료 후 입장 발행
        setTimeout(() => {
          const enterPayload = { 
            classid: parseInt(classId), 
            studentld: studentInfo.id, 
            studentName: studentInfo.name 
          };
          console.log('📤 [Socket] 학생 입장 발행:', enterPayload);
          console.log('📤 [Socket] 발행 주소:', SOCKET_CONFIG.PUBLISH.ENTER);
          
          client.publish({ 
            destination: SOCKET_CONFIG.PUBLISH.ENTER, 
            body: JSON.stringify(enterPayload) 
          });
          
          console.log('✅ [Socket] 입장 발행 완료');
          
          // ✅ 입장 후 접속자 수 요청 (500ms 후)
          setTimeout(() => {
            console.log('📤 [Socket] 접속자 수 요청');
            client.publish({
              destination: SOCKET_CONFIG.PUBLISH.REQUEST_COUNT,
              body: JSON.stringify({ classid: parseInt(classId) })
            });
          }, 500);
          
        }, 100);
      },
      
      onDisconnect: () => {
        console.log('⚠️ [Socket] Disconnected');
        setIsSocketConnected(false);
      },
      
      onWebSocketClose: () => {
        console.log('❌ [Socket] WebSocket Closed');
        setIsSocketConnected(false);
      },
      
      onStompError: (frame) => {
        console.error('❌ [Socket] STOMP Error:', frame.headers['message']);
        console.error('❌ [Socket] STOMP Error Body:', frame.body);
      },
    });
    
    client.activate();
    stompClient.current = client;
    
    return () => { 
      console.log('🔌 [Socket] Cleanup - 연결 해제');
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
      setIsSocketConnected(false); 
    };
  }, [classId, studentInfo.id, studentInfo.name]);

  if (!hasPermission) return <View style={styles.permissionContainer}><Text style={{color:'white'}}>카메라 권한 필요</Text></View>;
  if (device == null) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="white" /><Text style={{ color: 'white', marginTop: 10 }}>카메라 초기화 중...</Text></View>;
  if (model.state !== 'loaded') return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="white" /><Text style={{ color: 'white', marginTop: 10 }}>AI 모델 로딩 중...</Text></View>;

  return (
    <View style={styles.container}>
      <Camera 
        style={StyleSheet.absoluteFill}
        device={device} 
        isActive={isCameraActive}
        frameProcessor={frameProcessor} 
        pixelFormat="yuv"
        outputOrientation={'landscape-left' as OutputOrientation}
        
      />
      
      <View style={styles.bottomOverlay}>
        <ClassProgressBar targetMinutes={10} />
      </View>
      
      <View style={styles.statusText}>
        <Text style={{color:'white', fontSize: 20, fontWeight: 'bold'}}>{aiStatus}</Text>
      </View>
      
      <View style={styles.rightCenterContainer}>
        <TrafficLight status={aiStatus} />
        <View style={styles.studentCountBadge}>
          <Text style={styles.studentCountText}>👥 {studentCount}</Text>
        </View>
      </View>
      
      <View style={styles.alertButtonContainer}>
        <AlertButton 
          ref={alertRef} 
          onStatusChange={handleStudentStatusReport} 
        />
      </View>
      
      <CalibrationModal visible={showCalibration} onFinish={() => setShowCalibration(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  loadingContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  statusText: { position: 'absolute', top: 30, left: 30, zIndex: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 10 },
  rightCenterContainer: { position: 'absolute', right: 30, top: '40%', transform: [{ translateY: -50 }], zIndex: 10, alignItems: 'center' },
  studentCountBadge: { 
    marginTop: 15, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  studentCountText: { 
    color: "white", 
    fontSize: 16, 
    fontWeight: "700",
  },
  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, alignItems: 'center' },
  alertButtonContainer: { position: 'absolute', top: 50, right: 30, zIndex: 10 },
  permissionContainer: { flex: 1, backgroundColor: 'black', justifyContent: "center", alignItems: "center" },
})