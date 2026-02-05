import React, { useEffect, useState, useRef } from "react"
import { Text, View, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native"
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite'; 
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useSharedValue, Worklets } from 'react-native-worklets-core';
import * as ScreenOrientation from 'expo-screen-orientation';

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

const AI_CONFIG = {
  PROCESS_INTERVAL: 5,        
  FACE_CONFIDENCE_THRESHOLD: 0.4, 
  MISSING_FACE_LIMIT: 10,     

  MOVEMENT_THRESHOLD: 4.0,    
  MOVEMENT_SCORE_LIMIT: 10,   
  MOVEMENT_DECAY: 0.5,        

  GAZE_THRESHOLD_DIFF: 0.2, 
  GAZE_FRAME_LIMIT: 8,        

  STATUS: {
    FOCUSED: 0,
    MOVING: 1,
    AWAY: 2,
    UNFOCUS: 3,
    GAZE_OFF: 5
  }
};

const STATUS_MAP = {
  [AI_CONFIG.STATUS.FOCUSED]: "FOCUSED",
  [AI_CONFIG.STATUS.MOVING]: "MOVING",
  [AI_CONFIG.STATUS.AWAY]: "AWAY",
  [AI_CONFIG.STATUS.UNFOCUS]: "UNFOCUS",
  [AI_CONFIG.STATUS.GAZE_OFF]: "GAZE OFF",
} as const;

const LANDMARKS = {
  NOSE_TIP: 1,
  LEFT_EYE_LEFT: 33, LEFT_EYE_RIGHT: 133,
  RIGHT_EYE_LEFT: 362, RIGHT_EYE_RIGHT: 263,
  LEFT_IRIS: 468,
  RIGHT_IRIS: 473
};

const MODEL_SIZE = 256;

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

  const [showCalibration, setShowCalibration] = useState(false)

  const sharedStatus = useSharedValue(AI_CONFIG.STATUS.FOCUSED); 
  const lastNoseX = useSharedValue(0);
  const lastNoseY = useSharedValue(0);
  const movementScore = useSharedValue(0);
  const faceMissingCount = useSharedValue(0);
  const gazeOffCount = useSharedValue(0);
  const frameCounter = useSharedValue(0);
  
  const lastAlertTime = useRef(0);

  const [aiStatus, setAiStatus] = useState<string>("FOCUSED");
  const [studentCount, setStudentCount] = useState(0);
  const [isSocketConnected, setIsSocketConnected] = useState(false); 
  
  const stompClient = useRef<Client | null>(null);
  const alertRef = useRef<AlertButtonRef>(null);
  
  const studentData = useSelector((state: RootState) => state.auth.studentData);
  const classId = studentData?.classId?.toString() || "1"; 

  const studentInfo: StudentInfo = {
    id: studentData?.studentId || 4,
    name: studentData?.studentName || "김싸피", 
    classId: studentData?.classId || 1,  
  };

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  useEffect(() => {
    async function lockOrientation() {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    }
    lockOrientation();
    return () => { ScreenOrientation.unlockAsync(); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatusCode = sharedStatus.value;
      const newStatus = STATUS_MAP[currentStatusCode as keyof typeof STATUS_MAP] || "FOCUSED";
      
      setAiStatus((prev) => {
        if (prev !== newStatus) return newStatus;
        return prev;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    'worklet';
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  };

  const getGazeRatio = (eyeLeft: {x: number, y: number}, eyeRight: {x: number, y: number}, iris: {x: number, y: number}) => {
    'worklet';
    const eyeWidth = getDistance(eyeLeft.x, eyeLeft.y, eyeRight.x, eyeRight.y);
    const irisDist = getDistance(iris.x, iris.y, eyeLeft.x, eyeLeft.y);
    if (eyeWidth === 0) return 0.5;
    return irisDist / eyeWidth;
  };

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (model.state !== 'loaded' || model.model == null) return;

    frameCounter.value += 1;
    if (frameCounter.value % AI_CONFIG.PROCESS_INTERVAL !== 0) return;

    const resized = resize(frame, {
      scale: { width: MODEL_SIZE, height: MODEL_SIZE }, 
      pixelFormat: 'rgb',
      dataType: 'float32', 
    });

    try {
      const outputs = model.model.runSync([resized]);
      
      let landmarks: any = null;
      let faceScore = 0;

      for (let i = 0; i < outputs.length; i++) {
        const data = outputs[i];
        if (data.length > 100) {
          landmarks = data;
        } else if (data.length === 1) {
            const val = Number(data[0]);
            if (val > -10) faceScore = 1; 
        }
      }

      if (landmarks && landmarks.length > 0 && faceScore === 0) {
          const firstX = Number(landmarks[0]);
          if (firstX > 0 && firstX < 1) faceScore = 1;
      }

      // AWAY 판단
      if (faceScore <= 0 || !landmarks) {  
         faceMissingCount.value += 1;
         if (faceMissingCount.value > AI_CONFIG.MISSING_FACE_LIMIT) { 
           sharedStatus.value = AI_CONFIG.STATUS.AWAY; 
         }
         return;
      }
      faceMissingCount.value = 0;

      const getPoint = (idx: number) => ({ 
          x: Number(landmarks[idx * 3]) * MODEL_SIZE, 
          y: Number(landmarks[idx * 3 + 1]) * MODEL_SIZE 
      });

      // 시선 감지 (GAZE OFF)
      if (landmarks.length >= 478 * 3) {
        const lLeft = getPoint(LANDMARKS.LEFT_EYE_LEFT);
        const lRight = getPoint(LANDMARKS.LEFT_EYE_RIGHT);
        const lIris = getPoint(LANDMARKS.LEFT_IRIS);
        const rLeft = getPoint(LANDMARKS.RIGHT_EYE_LEFT);
        const rRight = getPoint(LANDMARKS.RIGHT_EYE_RIGHT);
        const rIris = getPoint(LANDMARKS.RIGHT_IRIS);

        const leftRatio = getGazeRatio(lLeft, lRight, lIris);
        const rightRatio = getGazeRatio(rLeft, rRight, rIris);
        const avgRatio = (leftRatio + rightRatio) / 2;

        if (Math.abs(avgRatio - 0.5) > AI_CONFIG.GAZE_THRESHOLD_DIFF) {
             gazeOffCount.value += 1;
        } else {
             gazeOffCount.value = Math.max(0, gazeOffCount.value - 1);
        }

        if (gazeOffCount.value > AI_CONFIG.GAZE_FRAME_LIMIT) {
             sharedStatus.value = AI_CONFIG.STATUS.GAZE_OFF;
             return;
        }
      }

      // 움직임 감지 (MOVING)
      const nose = getPoint(LANDMARKS.NOSE_TIP);
      const diff = Math.abs(nose.x - lastNoseX.value) + Math.abs(nose.y - lastNoseY.value);
      lastNoseX.value = nose.x;
      lastNoseY.value = nose.y;

      if (diff > AI_CONFIG.MOVEMENT_THRESHOLD) { 
        movementScore.value += 1;
      } else {
        movementScore.value = Math.max(0, movementScore.value - AI_CONFIG.MOVEMENT_DECAY);
      }

      if (movementScore.value > AI_CONFIG.MOVEMENT_SCORE_LIMIT) { 
        sharedStatus.value = AI_CONFIG.STATUS.MOVING;
      } else {
        sharedStatus.value = AI_CONFIG.STATUS.FOCUSED;
      }

    } catch (e) {
      // console.log('Worklet Error:', e);
    }
  }, [model]);

  // 수동 상태 보고 핸들러
  const handleStudentStatusReport = (status: string) => {
    console.log(`📥 [학생 보고] ${status}`);

    if (isSocketConnected && stompClient.current) {
      const payload = {
        classid: parseInt(classId),
        studentld: studentInfo.id,
        studentName: studentInfo.name,
        type: status, // RESTROOM / ACTIVITY
        detectedAt: new Date().toISOString()
      };
      stompClient.current.publish({ destination: "/app/alert", body: JSON.stringify(payload) });
    }
  };

  const sendStatusToServer = (status: string) => {
    if (!isSocketConnected || !stompClient.current) return;
    const now = Date.now();
    if (status !== "FOCUSED" && (now - lastAlertTime.current < 3000)) return;
    if (status !== "FOCUSED") lastAlertTime.current = now;

    let serverType: any = "UNFOCUS";
    if (status === "FOCUSED") serverType = "FOCUS";
    else if (status === "AWAY") serverType = "AWAY";
    else if (status === "GAZE OFF") serverType = "GAZE_OFF"; 
    else if (status === "RESTROOM") serverType = "restroom";
    else if (status === "ACTIVITY") serverType = "activity";

    const payload = {
      classid: parseInt(classId),
      studentld: studentInfo.id,
      studentName: studentInfo.name,
      type: serverType,
      detectedAt: new Date().toISOString()
    };
    stompClient.current.publish({ destination: "/app/alert", body: JSON.stringify(payload) });
  };

  useEffect(() => {
    if (isSocketConnected && aiStatus !== "FOCUSED") {
       sendStatusToServer(aiStatus);
       alertRef.current?.triggerAlert(aiStatus);
    }
  }, [aiStatus, isSocketConnected]);

  // 소켓 연결
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(SOCKET_CONFIG.BROKER_URL),
      reconnectDelay: SOCKET_CONFIG.RECONNECT_DELAY,
      onConnect: () => {
        setIsSocketConnected(true);
        const enterPayload = { classid: parseInt(classId), studentld: studentInfo.id, studentName: studentInfo.name };
        client.publish({ destination: "/app/enter", body: JSON.stringify(enterPayload) });
        client.subscribe(`/topic/class/${classId}/count`, (msg) => setStudentCount(JSON.parse(msg.body).count || 0));
      },
      onWebSocketClose: () => setIsSocketConnected(false),
    });
    client.activate();
    stompClient.current = client;
    return () => { stompClient.current?.deactivate(); setIsSocketConnected(false); };
  }, []);

  if (!hasPermission) return <View style={styles.permissionContainer}><Text style={{color:'white'}}>카메라 권한 필요</Text></View>;
  if (device == null) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="white" /><Text style={{ color: 'white' }}>카메라 로딩 중...</Text></View>;
  if (model.state !== 'loaded') return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="white" /><Text style={{ color: 'white' }}>AI 모델 로딩 중...</Text></View>;

  return (
    <View style={styles.container}>
      <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} frameProcessor={frameProcessor} pixelFormat="yuv" />
      <View style={styles.bottomOverlay}><ClassProgressBar targetMinutes={1} /></View>
      <View style={styles.rightCenterContainer}><TrafficLight status={aiStatus} /><Text style={styles.countText}>👥 {studentCount}명</Text></View>
      <View style={styles.alertButtonContainer}>
        <AlertButton ref={alertRef} onStatusChange={handleStudentStatusReport} />
      </View>
      <CalibrationModal visible={showCalibration} onFinish={() => setShowCalibration(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  loadingContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  rightCenterContainer: { position: 'absolute', right: 30, top: '40%', transform: [{ translateY: -50 }], zIndex: 10, alignItems: 'center' },
  countText: { color: "white", marginTop: 10, fontSize: 14, fontWeight: "600", backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, alignItems: 'center' },
  alertButtonContainer: { position: 'absolute', top: 50, right: 30, zIndex: 10 },
  permissionContainer: { flex: 1, backgroundColor: 'black', justifyContent: "center", alignItems: "center" },
})