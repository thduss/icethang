import React, { useEffect, useState, useRef } from "react"
import { Text, View, StyleSheet, ActivityIndicator } from "react-native"
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
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

const STATUS_MAP = {
  0: "FOCUSED",
  1: "MOVING",
  2: "AWAY",
  3: "UNFOCUS"
} as const;

interface StudentInfo {
  id: number;
  name: string;
  classId: number;
}

const NOSE_TIP_IDX = 1;

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

  // ✅ AlertButton에서 받은 상태 처리 함수
  const handleStudentStatusReport = (status: string) => {
    console.log(`📥 [학생 보고] 받은 상태: ${status}`);
    
    // ✅ RESTROOM과 ACTIVITY는 UI에서는 FOCUSED로 표시
    const displayStatus = (status === 'RESTROOM' || status === 'ACTIVITY') ? 'FOCUSED' : status;
    setAiStatus(displayStatus as AIStatus);
    
    // 서버에는 실제 상태(RESTROOM/ACTIVITY)를 전송
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
        destination: "/app/alert", 
        body: JSON.stringify(payload) 
      });
    }
  };
  
  const handleStatusChange = Worklets.createRunOnJS((newStatusCode: number) => {
    const statusText = STATUS_MAP[newStatusCode as keyof typeof STATUS_MAP] || "FOCUSED";
    console.log(`🎯 [Status Change] ${newStatusCode} -> ${statusText}`);
    setAiStatus(prev => {
        if (prev !== statusText) {
            console.log(`✅ [Status Updated] ${prev} -> ${statusText}`);
            return statusText;
        }
        return prev;
    });
  });

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
    if (frameCounter.value % 5 !== 0) return;

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
          if (faceMissingCount.value > 10) {
              logDebug('AWAY - face missing');
              handleStatusChange(2); 
          }
          return;
        }

        faceMissingCount.value = 0;
        
        const noseX = landmarks[NOSE_TIP_IDX * 3];
        const noseY = landmarks[NOSE_TIP_IDX * 3 + 1];

        if (shouldDetailLog) {
          logDebug('Nose position', { 
            x: noseX.toFixed(3), 
            y: noseY.toFixed(3) 
          });
        }

        const diff = Math.abs(noseX - lastNoseX.value) + Math.abs(noseY - lastNoseY.value);
        lastNoseX.value = noseX;
        lastNoseY.value = noseY;

        if (diff > 2.0) {
          movementScore.value = Math.min(30, movementScore.value + 1.5);
          if (shouldDetailLog) {
            logDebug('Movement!', `diff=${diff.toFixed(3)}, score=${movementScore.value.toFixed(1)}`);
          }
        } else {
          movementScore.value = Math.max(0, movementScore.value - 1.0);
        }

        const currentStatus = movementScore.value > 15 ? 1 : 0; 
        
        if (shouldDetailLog) {
          logDebug('Status', `code=${currentStatus}, score=${movementScore.value.toFixed(1)}`);
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
    stompClient.current.publish({ destination: "/app/alert", body: JSON.stringify(payload) });
  };

  useEffect(() => {
    console.log(`🔄 [Effect] status=${aiStatus}, connected=${isSocketConnected}`);
    // ✅ RESTROOM과 ACTIVITY는 알림을 트리거하지 않음 (FOCUSED로 취급)
    if (isSocketConnected && aiStatus !== "FOCUSED" && aiStatus !== "RESTROOM" && aiStatus !== "ACTIVITY") {
      sendStatusToServer(aiStatus);
      alertRef.current?.triggerAlert(aiStatus);
    }
  }, [aiStatus, isSocketConnected]);

  useEffect(() => {
    console.log('🔌 [Socket] Initializing...');
    const client = new Client({
      webSocketFactory: () => new SockJS(SOCKET_CONFIG.BROKER_URL),
      reconnectDelay: SOCKET_CONFIG.RECONNECT_DELAY,
      onConnect: () => {
        console.log('✅ [Socket] Connected!');
        setIsSocketConnected(true);
        const enterPayload = { classid: parseInt(classId), studentld: studentInfo.id, studentName: studentInfo.name };
        console.log('📤 [Socket] Enter:', enterPayload);
        client.publish({ destination: "/app/enter", body: JSON.stringify(enterPayload) });
        client.subscribe(`/topic/class/${classId}/count`, (msg) => {
          const count = JSON.parse(msg.body).count || 0;
          console.log('📥 [Socket] Count:', count);
          setStudentCount(count);
        });
      },
      onWebSocketClose: () => {
        console.log('❌ [Socket] Disconnected');
        setIsSocketConnected(false);
      },
    });
    client.activate();
    stompClient.current = client;
    return () => { 
      console.log('🔌 [Socket] Cleanup');
      stompClient.current?.deactivate(); 
      setIsSocketConnected(false); 
    };
  }, []);

  if (!hasPermission) return <View style={styles.permissionContainer}><Text style={{color:'white'}}>카메라 권한 필요</Text></View>;
  if (device == null) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="white" /><Text style={{ color: 'white', marginTop: 10 }}>카메라 초기화 중...</Text></View>;
  if (model.state !== 'loaded') return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="white" /><Text style={{ color: 'white', marginTop: 10 }}>AI 모델 로딩 중...</Text></View>;

  return (
    <View style={styles.container}>
      <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} frameProcessor={frameProcessor} pixelFormat="yuv"/>
      <View style={styles.bottomOverlay}><ClassProgressBar targetMinutes={1} /></View>
      <View style={styles.statusText}><Text style={{color:'white', fontSize: 20, fontWeight: 'bold'}}>{aiStatus}</Text></View>
      <View style={styles.rightCenterContainer}><TrafficLight status={aiStatus} /></View>
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
  statusText: { position: 'absolute', top: 120, left: 30, zIndex: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 10 },
  rightCenterContainer: { position: 'absolute', right: 30, top: '40%', transform: [{ translateY: -50 }], zIndex: 10, alignItems: 'center' },
  countText: { color: "white", marginTop: 10, fontSize: 14, fontWeight: "600", backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, alignItems: 'center' },
  alertButtonContainer: { position: 'absolute', top: 50, right: 30, zIndex: 10 },
  permissionContainer: { flex: 1, backgroundColor: 'black', justifyContent: "center", alignItems: "center" },
})