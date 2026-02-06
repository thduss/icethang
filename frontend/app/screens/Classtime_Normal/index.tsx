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

type AIStatus = "FOCUS" | "BLINKING" | "MOVING" | "GAZE OFF" | "SLEEPING" | "AWAY" | "RESTROOM" | "ACTIVITY" | "UNFOCUS"
type ClassMode = "NORMAL" | "DIGITAL";

// ==============================
// 설정값
// ==============================

// [데드존] 1.5 픽셀 이하의 떨림은 무시
const MOVEMENT_DEADZONE = 1.5; 
const POS_DIFF_SCALE = 1.0; 

// [임계값] 2.0 이상이면 움직임으로 간주
const MOVEMENT_THRESHOLD = 2.0; 
const HEAD_MOVEMENT_TH = 1.5;

// [졸음]
const DEFAULT_EAR_THRESHOLD = 0.15;
const EYE_CLOSED_TIME_LIMIT = 2000; 

// 기타
const MOVEMENT_TRIGGER_COUNT = 5; 
const SMOOTHING_ALPHA = 0.15;
const CALIBRATION_FRAMES = 30;
const AWAY_FRAME_LIMIT = 30;
const MIN_FACE_SCORE = -4.0;

const IDX = {
  NOSE_TIP: 1,
  CHIN: 152,
  LEFT_EYE_OUTER: 33,
  RIGHT_EYE_OUTER: 263,
  LEFT_MOUTH: 61,
  RIGHT_MOUTH: 291,
  FOREHEAD: 10,
  LEFT_EYE: [159, 145, 33, 133, 158, 153],
  RIGHT_EYE: [386, 374, 362, 263, 385, 380],
};

interface StudentInfo {
  id: number;
  name: string;
  classId: number;
}

// ==============================
// 계산 로직
// ==============================
const calcHeadPose = (landmarks: Float32Array) => {
  'worklet';
  const getP = (idx: number) => ({ x: landmarks[idx * 3], y: landmarks[idx * 3 + 1] });
  
  const nose = getP(IDX.NOSE_TIP);
  const chin = getP(IDX.CHIN);
  const leftEye = getP(IDX.LEFT_EYE_OUTER);
  const rightEye = getP(IDX.RIGHT_EYE_OUTER);
  const leftMouth = getP(IDX.LEFT_MOUTH);
  const rightMouth = getP(IDX.RIGHT_MOUTH);
  const forehead = getP(IDX.FOREHEAD);

  const eyeCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
  const eyeWidth = Math.sqrt(Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2));
  
  const noseOffset = nose.x - eyeCenter.x;
  const yaw = (noseOffset / eyeWidth) * 50;

  const faceHeight = Math.sqrt(Math.pow(chin.x - forehead.x, 2) + Math.pow(chin.y - forehead.y, 2));
  const mouthCenter = { x: (leftMouth.x + rightMouth.x) / 2, y: (leftMouth.y + rightMouth.y) / 2 };
  const verticalOffset = mouthCenter.y - eyeCenter.y;
  const pitch = (verticalOffset / faceHeight) * 50;

  const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

  return [yaw, pitch, roll];
};

const calcEAR = (landmarks: Float32Array, indices: number[]) => {
  'worklet';
  const getX = (i: number) => landmarks[i * 3];
  const getY = (i: number) => landmarks[i * 3 + 1];
  
  const v1 = Math.abs(getY(indices[1]) - getY(indices[5]));
  const v2 = Math.abs(getY(indices[2]) - getY(indices[4]));
  const h = Math.abs(getX(indices[0]) - getX(indices[3]));

  return (v1 + v2) / (2.0 * h);
};


export default function NormalClassScreen() {
  const router = useRouter();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  
  const model = useTensorflowModel(require('../../../assets/face_landmarker.tflite'));
  const { resize } = useResizePlugin();

  const [aiStatus, setAiStatus] = useState<AIStatus>("FOCUS");
  const [debugInfo, setDebugInfo] = useState("");

  const [studentCount, setStudentCount] = useState(0);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [showCalibration, setShowCalibration] = useState(true);
  const [currentMode, setCurrentMode] = useState<ClassMode>("NORMAL");
  const [isCameraActive, setIsCameraActive] = useState(true);

  const prevHeadPose = useSharedValue<[number, number, number] | null>(null);
  const isCalibrated = useSharedValue(false);
  const calibrationData = useSharedValue<number[]>([]);
  const faceMissingCount = useSharedValue(0);
  const lastBlinkTime = useSharedValue(0);
  const eyeClosedStart = useSharedValue<number | null>(null);
  const movementCounter = useSharedValue(0);
  const lastHeadPose = useSharedValue<[number, number, number]>([0,0,0]);
  const smoothedNosePos = useSharedValue<[number, number] | null>(null);
  const personalEarThreshold = useSharedValue(DEFAULT_EAR_THRESHOLD);

  const prevStatusRef = useRef<AIStatus | null>(null);
  const stompClient = useRef<Client | null>(null);
  const alertRef = useRef<AlertButtonRef>(null);

  const studentData = useSelector((state: RootState) => state.auth.studentData);
  const classId = studentData?.classId?.toString() || "1";
  const studentInfo: StudentInfo = {
    id: studentData?.studentId || 4,
    name: studentData?.studentName || "김싸피",
    classId: studentData?.classId || 1,
  };

  const handleStatusChange = Worklets.createRunOnJS((data: { status: string, debug: string }) => {
    setAiStatus(data.status as AIStatus);
    setDebugInfo(data.debug); 
  });

  const handleCalibrationFinish = Worklets.createRunOnJS((earTh: number) => {
    setShowCalibration(false);
    console.log(`✅ Calibration Finished. EAR Th: ${earTh.toFixed(3)}`);
  });

  const handleModeChange = (newMode: ClassMode) => {
    setCurrentMode(newMode);
    setIsCameraActive(false);
    setTimeout(() => {
      if (newMode === "NORMAL") router.replace("/screens/Classtime_Normal");
      else if (newMode === "DIGITAL") router.replace("/screens/Classtime_Digital");
    }, 300);
  };

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (model.state !== 'loaded') return;

    const resized = resize(frame, {
      scale: { width: 192, height: 192 },
      pixelFormat: 'rgb',
      dataType: 'float32',
      mirror: true
    });

    const outputs = model.model.runSync([resized]);

    // 1. AWAY 감지
    let isFaceDetected = false;
    if (outputs.length > 1) {
      const scores = outputs[1] as Float32Array;
      if (scores[0] > MIN_FACE_SCORE) isFaceDetected = true;
    } else if (outputs.length > 0 && (outputs[0] as Float32Array).length > 100) {
      isFaceDetected = true;
    }

    if (!isFaceDetected) {
      faceMissingCount.value += 1;
      if (faceMissingCount.value > AWAY_FRAME_LIMIT) {
        handleStatusChange({ status: "AWAY", debug: "No Face" });
      }
      return; 
    }
    faceMissingCount.value = 0;

    const landmarks = outputs[0] as Float32Array;
    const now = Date.now();

    const rawNoseX = landmarks[IDX.NOSE_TIP * 3];
    const rawNoseY = landmarks[IDX.NOSE_TIP * 3 + 1];

    const rawHead = calcHeadPose(landmarks);
    const leftEar = calcEAR(landmarks, IDX.LEFT_EYE);
    const rightEar = calcEAR(landmarks, IDX.RIGHT_EYE);
    const avgEar = (leftEar + rightEar) / 2.0;
    
    // [보정값 적용]
    const eyesOpen = avgEar > personalEarThreshold.value;

    let curHead = rawHead;
    let curNoseX = rawNoseX;
    let curNoseY = rawNoseY;

    if (prevHeadPose.value !== null) {
      curHead = [
        SMOOTHING_ALPHA * rawHead[0] + (1 - SMOOTHING_ALPHA) * prevHeadPose.value[0],
        SMOOTHING_ALPHA * rawHead[1] + (1 - SMOOTHING_ALPHA) * prevHeadPose.value[1],
        SMOOTHING_ALPHA * rawHead[2] + (1 - SMOOTHING_ALPHA) * prevHeadPose.value[2],
      ];
    }
    prevHeadPose.value = curHead;

    if (smoothedNosePos.value !== null) {
      curNoseX = SMOOTHING_ALPHA * rawNoseX + (1 - SMOOTHING_ALPHA) * smoothedNosePos.value[0];
      curNoseY = SMOOTHING_ALPHA * rawNoseY + (1 - SMOOTHING_ALPHA) * smoothedNosePos.value[1];
    }

    // Calibration
    if (!isCalibrated.value) {
      const newData = [...calibrationData.value, curHead[0], curHead[1], curHead[2], avgEar]; 
      calibrationData.value = newData;
      smoothedNosePos.value = [curNoseX, curNoseY]; 

      if (newData.length >= CALIBRATION_FRAMES * 4) {
        let sums = [0, 0, 0, 0];
        const count = newData.length / 4;
        for (let i = 0; i < newData.length; i += 4) {
          sums[0] += newData[i];
          sums[1] += newData[i+1];
          sums[2] += newData[i+2];
          sums[3] += newData[i+3];
        }
        
        const avgUserEar = sums[3] / count;
        let calculatedTh = avgUserEar * 0.6;
        if (calculatedTh < 0.1) calculatedTh = 0.1; 
        
        personalEarThreshold.value = calculatedTh;
        isCalibrated.value = true;
        handleCalibrationFinish(personalEarThreshold.value);
      } else {
        return; 
      }
    }

    const [yaw, pitch, roll] = curHead;

    // 2. 졸음 감지
    let eyesTooLongClosed = false;
    let eyeDuration = 0;
    if (!eyesOpen) {
      if (eyeClosedStart.value === null) eyeClosedStart.value = now;
      lastBlinkTime.value = now;
      eyeDuration = now - eyeClosedStart.value;
      if (eyeDuration > EYE_CLOSED_TIME_LIMIT) {
        eyesTooLongClosed = true;
      }
    } else {
      eyeClosedStart.value = null;
    }

    // 3. 움직임 감지
    const angleDiff = Math.abs(yaw - lastHeadPose.value[0]) + Math.abs(pitch - lastHeadPose.value[1]);
    lastHeadPose.value = [yaw, pitch, roll];

    let posDiff = 0;
    let rawDiff = 0; 

    if (smoothedNosePos.value !== null) {
        const diffX = Math.abs(curNoseX - smoothedNosePos.value[0]);
        const diffY = Math.abs(curNoseY - smoothedNosePos.value[1]);
        rawDiff = diffX + diffY;

        // [데드존]
        if (rawDiff < MOVEMENT_DEADZONE) {
            posDiff = 0;
        } else {
            posDiff = rawDiff * POS_DIFF_SCALE;
        }
    }
    smoothedNosePos.value = [curNoseX, curNoseY];

    const totalMovement = (!eyesOpen) ? 0 : (angleDiff + posDiff);

    if (totalMovement > MOVEMENT_THRESHOLD) {
      movementCounter.value += 1;
    } else {
      movementCounter.value = Math.max(0, movementCounter.value - 1);
    }
    const isMoving = movementCounter.value > MOVEMENT_TRIGGER_COUNT;

    // 4. 최종 판정
    let finalStatus: AIStatus = "FOCUS";
    let debugStr = `Diff: ${rawDiff.toFixed(2)}`;

    if (eyesTooLongClosed) {
      finalStatus = "UNFOCUS"; 
      debugStr = `SLEEP (${(eyeDuration/1000).toFixed(1)}s)`;
    } else if (isMoving) {
      finalStatus = "UNFOCUS"; 
      debugStr = `MOVING Score: ${totalMovement.toFixed(2)}`;
    } else {
      finalStatus = "FOCUS";
    }

    handleStatusChange({ status: finalStatus, debug: debugStr });

  }, [model]);

  // ==============================
  // UI
  // ==============================
  useEffect(() => { if (!hasPermission) requestPermission(); }, [hasPermission]);
  useEffect(() => {
    async function lockOrientation() {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    }
    lockOrientation();
    return () => { ScreenOrientation.unlockAsync(); };
  }, []);

  const sendStatusToServer = (status: AIStatus) => {
    if (!isSocketConnected || !stompClient.current) return;
    let serverType = status === "FOCUS" ? "FOCUS" : status === "AWAY" ? "AWAY" : "UNFOCUS";
    const payload = {
      classid: parseInt(classId),
      studentld: studentInfo.id,
      studentName: studentInfo.name,
      type: serverType,
      detectedAt: new Date().toISOString()
    };
    stompClient.current.publish({ destination: SOCKET_CONFIG.PUBLISH.ALERT, body: JSON.stringify(payload) });
  };

  const handleStudentStatusReport = (status: string) => {
    const displayStatus = (status === 'RESTROOM' || status === 'ACTIVITY') ? 'FOCUS' : status;
    setAiStatus(displayStatus as AIStatus);
    prevStatusRef.current = displayStatus as AIStatus; 
    if (isSocketConnected && stompClient.current) {
      const payload = {
        classid: parseInt(classId),
        studentld: studentInfo.id,
        studentName: studentInfo.name,
        type: status,
        detectedAt: new Date().toISOString()
      };
      stompClient.current.publish({ destination: SOCKET_CONFIG.PUBLISH.ALERT, body: JSON.stringify(payload) });
    }
  };

  useEffect(() => {
    if (isSocketConnected && aiStatus !== "RESTROOM" && aiStatus !== "ACTIVITY") {
      if (aiStatus !== prevStatusRef.current) {
        sendStatusToServer(aiStatus);
        if (aiStatus !== "FOCUS") {
          alertRef.current?.triggerAlert(aiStatus);
        }
        prevStatusRef.current = aiStatus;
      }
    }
  }, [aiStatus, isSocketConnected]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(SOCKET_CONFIG.BROKER_URL),
      reconnectDelay: SOCKET_CONFIG.RECONNECT_DELAY,
      onConnect: () => {
        setIsSocketConnected(true);
        setStudentCount(1);
        client.subscribe(SOCKET_CONFIG.SUBSCRIBE.STUDENT_COUNT(classId), (msg) => {
          try {
            const data = JSON.parse(msg.body);
            const count = data.count || data.studentCount || data.userCount || (typeof data === 'number' ? data : 0);
            setStudentCount(count);
          } catch(e) {}
        });
        client.subscribe(SOCKET_CONFIG.SUBSCRIBE.CLASS_TOPIC(classId), (msg) => {});
        client.subscribe(SOCKET_CONFIG.SUBSCRIBE.MODE_STATUS(classId), (msg) => {
          try {
            const data = JSON.parse(msg.body);
            if (data.mode === "NORMAL" || data.mode === "DIGITAL") handleModeChange(data.mode);
          } catch(e) {}
        });
        setTimeout(() => {
           client.publish({ 
             destination: SOCKET_CONFIG.PUBLISH.ENTER, 
             body: JSON.stringify({ classid: parseInt(classId), studentld: studentInfo.id, studentName: studentInfo.name }) 
           });
           client.publish({ destination: SOCKET_CONFIG.PUBLISH.REQUEST_COUNT, body: JSON.stringify({ classid: parseInt(classId) }) });
        }, 100);
      }
    });
    client.activate();
    stompClient.current = client;
    return () => { if(stompClient.current) stompClient.current.deactivate(); };
  }, [classId]);

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
      
      <CalibrationModal visible={showCalibration} onFinish={() => {/* 자동 종료 */}} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  loadingContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  statusText: { position: 'absolute', top: 30, left: 30, zIndex: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 15, borderRadius: 10 },
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
  studentCountText: { color: "white", fontSize: 16, fontWeight: "700" },
  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, alignItems: 'center' },
  alertButtonContainer: { position: 'absolute', top: 50, right: 30, zIndex: 10 },
  permissionContainer: { flex: 1, backgroundColor: 'black', justifyContent: "center", alignItems: "center" },
})