import React, { useEffect, useState, useRef, useCallback } from "react";
import { Text, View, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity, Image } from "react-native";
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor, useCameraFormat, OutputOrientation } from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useSharedValue, Worklets } from 'react-native-worklets-core';
import { useRouter, useLocalSearchParams } from "expo-router";
import { getStudentXp, getStudentLogs } from '../../services/studentService';
import { LEVEL_RULES } from '../../constants/levelRules';

import ClassProgressBar from "../../components/ClassProgressBar";
import AlertButton, { AlertButtonRef } from "../../components/AlertButton";
import TrafficLight from "../../components/TrafficLight";
import CalibrationModal from "../../components/Calibration";
import ClassResultModal from "../../components/ClassResultModal";
import LevelUpRewardModal from "../../components/LevelUpRewardModal";

import { SOCKET_CONFIG } from "../../api/socket";
import { stompClient, connectSocket, disconnectSocket, enterClass, sendAlert, sendStudentRequest } from "../../utils/socket";
import { useSelector } from "react-redux";
import { RootState } from "../../store/stores";

type AIStatus = "FOCUS" | "BLINKING" | "MOVING" | "GAZE OFF" | "SLEEPING" | "AWAY" | "RESTROOM" | "ACTIVITY" | "UNFOCUS";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// AI 설정값
const MOVEMENT_DEADZONE = 1.5;
const POS_DIFF_SCALE = 1.0;
const MOVEMENT_THRESHOLD = 2.0;
const HEAD_MOVEMENT_TH = 1.5;
const DEFAULT_EAR_THRESHOLD = 0.15;
const EYE_CLOSED_TIME_LIMIT = 2000;
const MOVEMENT_TRIGGER_COUNT = 5;
const SMOOTHING_ALPHA = 0.15;
const CALIBRATION_FRAMES = 30;
const AWAY_FRAME_LIMIT = 30;
const MIN_FACE_SCORE = -4.0;

const IDX = {
  NOSE_TIP: 1, CHIN: 152, LEFT_EYE_OUTER: 33, RIGHT_EYE_OUTER: 263,
  LEFT_MOUTH: 61, RIGHT_MOUTH: 291, FOREHEAD: 10,
  LEFT_EYE: [159, 145, 33, 133, 158, 153],
  RIGHT_EYE: [386, 374, 362, 263, 385, 380],
};

// AI 계산 함수 (Worklets)
const calcHeadPose = (landmarks: Float32Array) => {
  'worklet';
  const getP = (idx: number) => ({ x: landmarks[idx * 3], y: landmarks[idx * 3 + 1] });
  const nose = getP(IDX.NOSE_TIP);
  const chin = getP(IDX.CHIN);
  const leftEye = getP(IDX.LEFT_EYE_OUTER);
  const rightEye = getP(IDX.RIGHT_EYE_OUTER);
  const forehead = getP(IDX.FOREHEAD);
  const eyeCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
  const eyeWidth = Math.sqrt(Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2));
  const yaw = ((nose.x - eyeCenter.x) / eyeWidth) * 50;
  const faceHeight = Math.sqrt(Math.pow(chin.x - forehead.x, 2) + Math.pow(chin.y - forehead.y, 2));
  const pitch = (((getP(IDX.LEFT_MOUTH).y + getP(IDX.RIGHT_MOUTH).y) / 2 - eyeCenter.y) / faceHeight) * 50;
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
  const params = useLocalSearchParams();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const format = useCameraFormat(device, [{ videoResolution: { width: 1280, height: 720 } }, { fps: 30 }]);
  const model = useTensorflowModel(require('../../../assets/face_landmarker.tflite'));
  const { resize } = useResizePlugin();

  const [aiStatus, setAiStatus] = useState<AIStatus>("FOCUS");
  const [studentCount, setStudentCount] = useState(0);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [showCalibration, setShowCalibration] = useState(true);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [isLevelUpVisible, setIsLevelUpVisible] = useState(false);
  const [hasLevelUpData, setHasLevelUpData] = useState(false);
  const [resultData, setResultData] = useState({ focusRate: 0, currentXP: 0, maxXP: 100 });

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
  const aiPaused = useSharedValue(false);

  const prevStatusRef = useRef<AIStatus | null>(null);
  const alertRef = useRef<AlertButtonRef>(null);
  const isExiting = useRef(false);

  const studentData = useSelector((state: RootState) => state.auth.studentData);
  const classId = params.classId ? String(params.classId) : studentData?.classId?.toString() || "1";

  const handleStatusChange = Worklets.createRunOnJS((data: { status: string }) => { setAiStatus(data.status as AIStatus); });
  const handleCalibrationFinish = Worklets.createRunOnJS(() => { setShowCalibration(false); });

  const fetchClassResult = async () => {
    if (!studentData?.studentId) return;
    try {
      const [xpData, logs] = await Promise.all([
        getStudentXp(Number(classId), studentData.studentId),
        getStudentLogs(Number(classId), studentData.studentId),
      ]);

      const latestLog = logs.length > 0 ? logs[0] : null;
      const gained = latestLog?.focusRate ?? 0;

      const currentLevel = xpData.currentLevel;
      const levelXp = LEVEL_RULES[currentLevel] ?? 0;
      const nextLevelXp = LEVEL_RULES[currentLevel + 1] ?? levelXp;
      const maxXpForLevel = nextLevelXp - levelXp || 1;

      const xpInLevel = xpData.currentXp - levelXp;
      setResultData({ focusRate: gained, currentXP: xpInLevel + gained, maxXP: maxXpForLevel });
    } catch (error) {
      console.error("❌ 결과 조회 실패:", error);
    } finally { setIsResultVisible(true); }
  };

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (model.state !== 'loaded' || isExiting.current || aiPaused.value) return;
    const resized = resize(frame, { scale: { width: 192, height: 192 }, pixelFormat: 'rgb', dataType: 'float32', mirror: true });
    const outputs = model.model.runSync([resized]);

    // 1. AWAY Check
    let isFaceDetected = false;
    if (outputs.length > 1) { if ((outputs[1] as Float32Array)[0] > MIN_FACE_SCORE) isFaceDetected = true; }
    else if (outputs.length > 0 && (outputs[0] as Float32Array).length > 100) { isFaceDetected = true; }

    if (!isFaceDetected) {
      faceMissingCount.value += 1;
      if (faceMissingCount.value > AWAY_FRAME_LIMIT) { handleStatusChange({ status: "AWAY" }); }
      return;
    }
    faceMissingCount.value = 0;

    const landmarks = outputs[0] as Float32Array;
    const now = Date.now();

    // 2. Data Calculation
    const rawNoseX = landmarks[IDX.NOSE_TIP * 3];
    const rawNoseY = landmarks[IDX.NOSE_TIP * 3 + 1];

    const rawHead = calcHeadPose(landmarks);
    const avgEar = (calcEAR(landmarks, IDX.LEFT_EYE) + calcEAR(landmarks, IDX.RIGHT_EYE)) / 2.0;
    const eyesOpen = avgEar > personalEarThreshold.value;

    // 3. Smoothing (Head)
    let curHead = rawHead;
    if (prevHeadPose.value !== null) {
      curHead = [
        SMOOTHING_ALPHA * rawHead[0] + (1 - SMOOTHING_ALPHA) * prevHeadPose.value[0],
        SMOOTHING_ALPHA * rawHead[1] + (1 - SMOOTHING_ALPHA) * prevHeadPose.value[1],
        SMOOTHING_ALPHA * rawHead[2] + (1 - SMOOTHING_ALPHA) * prevHeadPose.value[2],
      ];
    }
    prevHeadPose.value = curHead as [number, number, number];

    // 3-2. Smoothing (Nose Position)
    let curNoseX = rawNoseX;
    let curNoseY = rawNoseY;
    if (smoothedNosePos.value !== null) {
      curNoseX = SMOOTHING_ALPHA * rawNoseX + (1 - SMOOTHING_ALPHA) * smoothedNosePos.value[0];
      curNoseY = SMOOTHING_ALPHA * rawNoseY + (1 - SMOOTHING_ALPHA) * smoothedNosePos.value[1];
    }

    // 4. Calibration
    if (!isCalibrated.value) {
      const newData = [...calibrationData.value, curHead[0], curHead[1], curHead[2], avgEar];
      calibrationData.value = newData;
      smoothedNosePos.value = [curNoseX, curNoseY];
      if (newData.length >= CALIBRATION_FRAMES * 4) {
        let sums = [0, 0, 0, 0];
        for (let i = 0; i < newData.length; i += 4) { sums[0] += newData[i]; sums[1] += newData[i+1]; sums[2] += newData[i+2]; sums[3] += newData[i+3]; }
        const count = newData.length / 4;
        personalEarThreshold.value = (sums[3] / count) * 0.6 < 0.1 ? 0.1 : (sums[3] / count) * 0.6;
        isCalibrated.value = true;
        handleCalibrationFinish();
      }
      return;
    }

    const [yaw, pitch, roll] = curHead;

    // 5. Sleep Detection
    let eyesTooLongClosed = false;
    let eyeDuration = 0;
    if (!eyesOpen) {
      if (eyeClosedStart.value === null) eyeClosedStart.value = now;
      eyeDuration = now - eyeClosedStart.value;
      if (eyeDuration > EYE_CLOSED_TIME_LIMIT) eyesTooLongClosed = true;
    } else { eyeClosedStart.value = null; }

    // 6. Movement Detection (Head Angle + Nose Position)
    const angleDiff = Math.abs(yaw - lastHeadPose.value[0]) + Math.abs(pitch - lastHeadPose.value[1]);
    lastHeadPose.value = [yaw, pitch, roll];

    let posDiff = 0;
    let rawDiff = 0;
    if (smoothedNosePos.value !== null) {
      const diffX = Math.abs(curNoseX - smoothedNosePos.value[0]);
      const diffY = Math.abs(curNoseY - smoothedNosePos.value[1]);
      rawDiff = diffX + diffY;
      if (rawDiff < MOVEMENT_DEADZONE) {
        posDiff = 0;
      } else {
        posDiff = rawDiff * POS_DIFF_SCALE;
      }
    }
    smoothedNosePos.value = [curNoseX, curNoseY];

    const totalMovement = (!eyesOpen) ? 0 : (angleDiff + posDiff);

    if (totalMovement > MOVEMENT_THRESHOLD) movementCounter.value += 1;
    else movementCounter.value = Math.max(0, movementCounter.value - 1);
    const isMoving = movementCounter.value > MOVEMENT_TRIGGER_COUNT;

    // 7. Final Status
    let finalStatus: AIStatus = "FOCUS";
    if (eyesTooLongClosed) finalStatus = "UNFOCUS";
    else if (isMoving) finalStatus = "UNFOCUS";

    handleStatusChange({ status: finalStatus });
  }, [model]);

  // 방향 고정 로직
  useEffect(() => {
    if (!hasPermission) requestPermission();
    async function init() {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
        setTimeout(() => setIsCameraInitialized(true), 800);
    }
    init();
    return () => { isExiting.current = true; };
  }, [hasPermission]);

  useEffect(() => {
    if (isSocketConnected && aiStatus !== prevStatusRef.current) {
      // AI 일시정지 중, RESTROOM/ACTIVITY 상태면 전송 스킵
      if (!aiPaused.value && aiStatus !== 'RESTROOM' && aiStatus !== 'ACTIVITY') {
        if (studentData) {
          sendAlert(Number(classId), studentData.studentId, studentData.studentName, aiStatus === "FOCUS" ? "FOCUS" : aiStatus === "AWAY" ? "AWAY" : "UNFOCUS");
        }
        if (aiStatus !== "FOCUS") alertRef.current?.triggerAlert(aiStatus);
      }
      prevStatusRef.current = aiStatus;
    }
  }, [aiStatus, isSocketConnected, studentData]);

  useEffect(() => {
    const onConnected = () => {
      setIsSocketConnected(true);
      setStudentCount(1);
      if (studentData) {
        enterClass(Number(classId), studentData.studentId, studentData.studentName);
      }

      stompClient.subscribe(SOCKET_CONFIG.SUBSCRIBE.STUDENT_COUNT(classId), (msg) => {
        setStudentCount(JSON.parse(msg.body).count || 0);
      });

      stompClient.subscribe(SOCKET_CONFIG.SUBSCRIBE.CLASS_TOPIC(classId), async (msg) => {
        const body = JSON.parse(msg.body);
        if (body.type === 'CLASS_FINISHED') {
          isExiting.current = true;
          await fetchClassResult();
          disconnectSocket();
        }
      });

      stompClient.subscribe(SOCKET_CONFIG.SUBSCRIBE.MODE_STATUS(classId), (msg) => {
        if (JSON.parse(msg.body).mode === "DIGITAL") router.replace(`/screens/Classtime_Digital?classId=${classId}`);
      });
    };

    stompClient.onConnect = onConnected;
    if (stompClient.connected) onConnected();
  }, [classId, studentData]);

  const handleStudentStatusReport = (status: string) => {
    if (status === 'RESTROOM' || status === 'ACTIVITY') {
      aiPaused.value = true;
      setAiStatus(status as AIStatus);
      if (studentData) { sendStudentRequest(Number(classId), studentData.studentId, studentData.studentName, status as any); }
    } else {
      setAiStatus(status as AIStatus);
      if (studentData) { sendAlert(Number(classId), studentData.studentId, studentData.studentName, status as any); }
    }
  };

  const handleReturn = () => {
    aiPaused.value = false;
    setAiStatus("FOCUS");
    prevStatusRef.current = null;
    if (studentData) { sendStudentRequest(Number(classId), studentData.studentId, studentData.studentName, "FOCUS"); }
  };

  if (!hasPermission) return <View style={styles.permissionContainer}><Text style={{color:'white'}}>카메라 권한 필요</Text></View>;
  if (model.state !== 'loaded' || !isCameraInitialized) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#ffffff" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <View style={styles.cameraWrapper}>
          <Camera
            style={StyleSheet.absoluteFill} device={device!} format={format} isActive={!isResultVisible}
            frameProcessor={frameProcessor} pixelFormat="yuv" resizeMode="cover"
            androidPreviewViewType="texture-view"
          />
        </View>
      </View>

      <View style={styles.bottomOverlay}><ClassProgressBar targetMinutes={10} /></View>
      <View style={styles.rightCenterContainer}>
        <TrafficLight status={aiStatus} />
        <View style={styles.studentCountBadge}><Text style={styles.studentCountText}>👥 {studentCount}</Text></View>
      </View>
      <View style={styles.alertButtonContainer}><AlertButton ref={alertRef} onStatusChange={handleStudentStatusReport} onReturn={handleReturn} /></View>

      <CalibrationModal visible={showCalibration} onFinish={() => {}} />

      <ClassResultModal
        visible={isResultVisible}
        onClose={() => {
          setIsResultVisible(false);
          if (hasLevelUpData) setIsLevelUpVisible(true);
          else router.replace('/screens/Student_Home');
        }}
        focusRate={resultData.focusRate} currentXP={resultData.currentXP} maxXP={resultData.maxXP}
      />

      <LevelUpRewardModal
        visible={isLevelUpVisible}
        onClose={() => { setIsLevelUpVisible(false); router.replace('/screens/Student_Home'); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  loadingContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  cameraContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  cameraWrapper: { width: SCREEN_HEIGHT, height: SCREEN_WIDTH, transform: [{ rotate: '270deg' }, { scale: 1.1 }] },
  rightCenterContainer: { position: 'absolute', right: 30, top: '40%', transform: [{ translateY: -50 }], zIndex: 10, alignItems: 'center' },
  studentCountBadge: { marginTop: 15, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  studentCountText: { color: "white", fontSize: 16, fontWeight: "700" },
  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, alignItems: 'center' },
  alertButtonContainer: { position: 'absolute', top: 50, right: 30, zIndex: 10 },
  permissionContainer: { flex: 1, backgroundColor: 'black', justifyContent: "center", alignItems: "center" },
});
