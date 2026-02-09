import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { View, StyleSheet, AppState, NativeModules, ActivityIndicator, Text, Image, TouchableOpacity } from "react-native";
import { Camera, useCameraDevice, useFrameProcessor } from "react-native-vision-camera";
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useSharedValue, Worklets } from 'react-native-worklets-core';
import PipHandler from 'react-native-pip-android';
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSelector } from "react-redux";
import axios from 'axios';

import ClassResultModal from "../../components/ClassResultModal";
import LevelUpRewardModal from "../../components/LevelUpRewardModal";
import { stompClient, connectSocket, disconnectSocket } from "../../utils/socket";
import { RootState } from "../../store/stores";
import * as SecureStore from "expo-secure-store";

const { OverlayModule } = NativeModules;

// 캐릭터 및 배경 매핑
const charMap: Record<string, string> = { 
  "5": "char_1", "6": "char_2", "7": "char_3", "8": "char_4", 
  "9": "char_5", "10": "char_6", "11": "char_7", "12": "char_8",
  "13": "char_9", "14": "char_10", "15": "char_11", "16": "char_12"
};
const bgMap: Record<string, string> = { "1": "background1", "2": "background2", "3": "background3", "4": "background4" };

// ==========================================
// [무조건 포함] 정밀 AI Constants & Thresholds
// ==========================================
const GAZE_RATIO_TH_X = 0.20;
const GAZE_RATIO_TH_Y = 0.15;
const GAZE_CORRECTION_YAW = 0.015;
const GAZE_CORRECTION_PITCH = 0.002;
const DEFAULT_EAR_THRESHOLD = 0.12;
const EYE_CLOSED_TIME_LIMIT = 2000;
const MOVEMENT_DEADZONE = 1.5;
const POS_DIFF_SCALE = 1.0;
const MOVEMENT_THRESHOLD = 2.0;
const HEAD_MOVEMENT_TH = 1.5;
const MOVEMENT_TRIGGER_COUNT = 5;
const SMOOTHING_ALPHA = 0.15;
const SMOOTHING_POS = 0.15;
const CALIBRATION_FRAMES = 30;
const BLINK_BUFFER_TIME = 1500;
const AWAY_FRAME_LIMIT = 30;
const MIN_FACE_SCORE = -4.0;

const IDX = {
  NOSE_TIP: 1, CHIN: 152, LEFT_EYE_OUTER: 33, RIGHT_EYE_OUTER: 263,
  LEFT_MOUTH: 61, RIGHT_MOUTH: 291, FOREHEAD: 10,
  LEFT_EYE: [159, 145, 33, 133, 158, 153], RIGHT_EYE: [386, 374, 362, 263, 385, 380],
  LEFT_IRIS: 468, RIGHT_IRIS: 473, LEFT_EYE_BOX: [33, 133, 159, 145], RIGHT_EYE_BOX: [362, 263, 386, 374]
};

// ==========================================
// [무조건 포함] AI 계산 함수 (Worklets)
// ==========================================
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
  const yaw = ((nose.x - eyeCenter.x) / eyeWidth) * 50;
  const faceHeight = Math.sqrt(Math.pow(chin.x - forehead.x, 2) + Math.pow(chin.y - forehead.y, 2));
  const mouthCenter = { x: (leftMouth.x + rightMouth.x) / 2, y: (leftMouth.y + rightMouth.y) / 2 };
  const pitch = ((mouthCenter.y - eyeCenter.y) / faceHeight) * 50;
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

const calcGazeRatio = (landmarks: Float32Array) => {
  'worklet';
  const getX = (i: number) => landmarks[i * 3];
  const getY = (i: number) => landmarks[i * 3 + 1];
  const getRatio = (boxIdx: number[], irisIdx: number) => {
    const left = getX(boxIdx[0]); const right = getX(boxIdx[1]);
    const top = getY(boxIdx[2]); const bottom = getY(boxIdx[3]);
    const irisX = getX(irisIdx); const irisY = getY(irisIdx);
    const width = Math.abs(right - left); const height = Math.abs(bottom - top);
    return [width > 0 ? (irisX - left) / width : 0.5, height > 0 ? (irisY - top) / height : 0.5];
  };
  return [(getRatio(IDX.LEFT_EYE_BOX, IDX.LEFT_IRIS)[0] + getRatio(IDX.RIGHT_EYE_BOX, IDX.RIGHT_IRIS)[0]) / 2, (getRatio(IDX.LEFT_EYE_BOX, IDX.LEFT_IRIS)[1] + getRatio(IDX.RIGHT_EYE_BOX, IDX.RIGHT_IRIS)[1]) / 2];
};

export default function DigitalClassScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const studentData = useSelector((state: RootState) => state.auth.studentData);
  const classId = (params.classId as string) || studentData?.classId?.toString();
  
  const isExiting = useRef(false);
  const appState = useRef(AppState.currentState);
  const authState = useSelector((state: RootState) => state.auth) as any;
  const themeState = useSelector((state: RootState) => state.theme) as any;
  const user = authState?.user;

  const [studentStatus, setStudentStatus] = useState<string>("FOCUS");
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [resultData, setResultData] = useState({ focusRate: 0, currentXP: 0, maxXP: 100 });

  // ==========================================
  // AI Shared Values
  // ==========================================
  const prevHeadPose = useSharedValue<[number, number, number] | null>(null);
  const prevGaze = useSharedValue<[number, number] | null>(null);
  const isCalibrated = useSharedValue(false);
  const calibrationData = useSharedValue<number[]>([]);
  const baseline = useSharedValue<number[]>([0, 0, 0, 0, 0]); 
  const faceMissingCount = useSharedValue(0);
  const lastBlinkTime = useSharedValue(0);
  const eyeClosedStart = useSharedValue<number | null>(null);
  const movementCounter = useSharedValue(0);
  const lastHeadPose = useSharedValue<[number, number, number]>([0, 0, 0]);
  const smoothedNosePos = useSharedValue<[number, number] | null>(null);
  const personalEarThreshold = useSharedValue(DEFAULT_EAR_THRESHOLD);
  const prevStatusRef = useRef<string>("FOCUS");

  const currentTheme = useMemo(() => ({
    character: charMap[String(themeState?.equippedCharacterId)] || "char_1",
    background: bgMap[String(themeState?.equippedBackgroundId)] || "background1"
  }), [themeState]);

  // 화면 이동 로직 (전환 안정성 강화)
  const handleTransition = useCallback((type: 'FINISHED' | 'NORMAL', data?: any) => {
    if (isExiting.current) return;
    isExiting.current = true;

    OverlayModule?.hideOverlay();
    OverlayModule?.relaunchApp(); 

    if (type === 'FINISHED' && data) {
      setResultData({ focusRate: data.focusRate || 0, currentXP: data.currentXP || 0, maxXP: data.maxXP || 100 });
      setTimeout(() => setIsResultVisible(true), 800);
    } else {
      setTimeout(() => {
        router.replace({ pathname: "/screens/Classtime_Normal", params: { classId: classId } });
      }, 700);
    }
  }, [classId]);

  const setStatusJS = Worklets.createRunOnJS((newStatus: string, details: string) => {
    if (isExiting.current || isResultVisible || !classId || classId === "undefined") return;
    if (prevStatusRef.current !== newStatus) {
      console.log(`🤖 [AI 감지]: ${newStatus} | ${details}`);
      prevStatusRef.current = newStatus;
      setStudentStatus(newStatus);
      if (stompClient?.connected) {
        const kst = new Date(new Date().getTime() + 32400000).toISOString().split('.')[0];
        stompClient.publish({
          destination: `/pub/class/${classId}/status`,
          body: JSON.stringify({ classId: Number(classId), studentId: user?.id, studentName: user?.name, type: newStatus, detectedAt: kst }),
        });
      }
      OverlayModule?.updateOverlayStatus(newStatus);
    }
  });

  const device = useCameraDevice('front');
  const model = useTensorflowModel(require('../../../assets/face_landmarker.tflite'));
  const { resize } = useResizePlugin();

  // [무조건 포함] 정밀 AI Frame Processor
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (model.state !== 'loaded' || isExiting.current) return;
    const resized = resize(frame, { scale: { width: 192, height: 192 }, pixelFormat: 'rgb', dataType: 'float32' });
    const outputs = model.model.runSync([resized]);

    let isFaceDetected = false;
    if (outputs.length > 1 && (outputs[1] as Float32Array)[0] > MIN_FACE_SCORE) isFaceDetected = true;
    else if (outputs.length > 0 && (outputs[0] as Float32Array).length > 100) isFaceDetected = true;

    if (!isFaceDetected) {
      faceMissingCount.value += 1;
      if (faceMissingCount.value > AWAY_FRAME_LIMIT) setStatusJS("AWAY", "자리 이탈");
      return;
    }
    faceMissingCount.value = 0;

    const landmarks = outputs[0] as Float32Array;
    const now = Date.now();
    const rawNosePos = [landmarks[IDX.NOSE_TIP * 3], landmarks[IDX.NOSE_TIP * 3 + 1]];
    const rawHead = calcHeadPose(landmarks);
    const rawGaze = calcGazeRatio(landmarks);
    const avgEar = (calcEAR(landmarks, IDX.LEFT_EYE) + calcEAR(landmarks, IDX.RIGHT_EYE)) / 2.0;

    let curHead = rawHead; let curGaze = rawGaze; let curNose = rawNosePos;
    if (prevHeadPose.value !== null) curHead = [SMOOTHING_ALPHA * rawHead[0] + (1 - SMOOTHING_ALPHA) * prevHeadPose.value[0], SMOOTHING_ALPHA * rawHead[1] + (1 - SMOOTHING_ALPHA) * prevHeadPose.value[1], SMOOTHING_ALPHA * rawHead[2] + (1 - SMOOTHING_ALPHA) * prevHeadPose.value[2]];
    prevHeadPose.value = curHead;
    if (prevGaze.value !== null) curGaze = [SMOOTHING_ALPHA * rawGaze[0] + (1 - SMOOTHING_ALPHA) * prevGaze.value[0], SMOOTHING_ALPHA * rawGaze[1] + (1 - SMOOTHING_ALPHA) * prevGaze.value[1]];
    prevGaze.value = curGaze;
    if (smoothedNosePos.value !== null) curNose = [SMOOTHING_POS * rawNosePos[0] + (1 - SMOOTHING_POS) * smoothedNosePos.value[0], SMOOTHING_POS * rawNosePos[1] + (1 - SMOOTHING_POS) * smoothedNosePos.value[1]];
    smoothedNosePos.value = [curNose[0], curNose[1]];

    if (!isCalibrated.value) {
      const newData = [...calibrationData.value, curHead[0], curHead[1], curHead[2], curGaze[0], curGaze[1], avgEar];
      calibrationData.value = newData;
      if (newData.length >= CALIBRATION_FRAMES * 6) {
        let sums = [0, 0, 0, 0, 0, 0]; const count = newData.length / 6;
        for (let i = 0; i < newData.length; i += 6) for (let j = 0; j < 6; j++) sums[j] += newData[i+j];
        baseline.value = [sums[0]/count, sums[1]/count, sums[2]/count, sums[3]/count, sums[4]/count];
        personalEarThreshold.value = Math.max(0.1, (sums[5]/count) * 0.6);
        isCalibrated.value = true; setStatusJS("FOCUS", "보정 완료!");
      }
      return;
    }

    const [yaw, pitch] = curHead; const [baseYaw, basePitch, baseRoll, baseGx, baseGy] = baseline.value;
    const correctedGazeX = curGaze[0] + (yaw * GAZE_CORRECTION_YAW);
    const correctedGazeY = curGaze[1] + (pitch * GAZE_CORRECTION_PITCH);

    let eyesTooLongClosed = false;
    if (avgEar <= personalEarThreshold.value) {
      if (eyeClosedStart.value === null) eyeClosedStart.value = now;
      lastBlinkTime.value = now;
      if (now - eyeClosedStart.value > EYE_CLOSED_TIME_LIMIT) eyesTooLongClosed = true;
    } else eyeClosedStart.value = null;

    const angleDiff = Math.abs(yaw - lastHeadPose.value[0]) + Math.abs(pitch - lastHeadPose.value[1]);
    lastHeadPose.value = [yaw, pitch, curHead[2]];
    const totalMovement = (avgEar <= personalEarThreshold.value) ? 0 : angleDiff;
    if (totalMovement > MOVEMENT_THRESHOLD) movementCounter.value += 1;
    else movementCounter.value = Math.max(0, movementCounter.value - 1);

    const isGazeFocused = (now - lastBlinkTime.value < BLINK_BUFFER_TIME) || (Math.abs(correctedGazeX - baseGx) < (GAZE_RATIO_TH_X + Math.abs(yaw)*0.005) && Math.abs(correctedGazeY - baseGy) < GAZE_RATIO_TH_Y);

    let status = "FOCUS"; let detail = "집중 중";
    if (eyesTooLongClosed) { status = "UNFOCUS"; detail = "졸음 감지"; }
    else if (movementCounter.value > MOVEMENT_TRIGGER_COUNT) { status = "UNFOCUS"; detail = "움직임 감지"; }
    else if (!isGazeFocused) { status = "UNFOCUS"; detail = "시선 이탈"; }
    setStatusJS(status, detail);
  }, [model]);

  // 소켓 구독 로직
  useEffect(() => {
    let classSub: any = null; let modeSub: any = null;
    if (!classId || classId === "undefined") return;
    const setup = () => {
      classSub = stompClient.subscribe(`/topic/class/${classId}`, (msg) => {
        const body = JSON.parse(msg.body);
        if (body.type === 'CLASS_FINISHED') handleTransition('FINISHED', body);
      });
      modeSub = stompClient.subscribe(`/topic/class/${classId}/mode`, (msg) => {
        const body = JSON.parse(msg.body);
        if (body.mode === 'NORMAL') handleTransition('NORMAL');
      });
    };
    if (stompClient.connected) setup(); else stompClient.onConnect = setup;
    return () => { if (classSub) classSub.unsubscribe(); if (modeSub) modeSub.unsubscribe(); };
  }, [classId, handleTransition]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (isExiting.current || isResultVisible) { OverlayModule?.hideOverlay(); return; }
      if (appState.current === "active" && nextState.match(/inactive|background/)) {
        OverlayModule?.showOverlay("집중도 측정 중", false, currentTheme.character, currentTheme.background, 0, 0);
        setTimeout(() => { if (!isExiting.current && !isResultVisible) PipHandler.enterPipMode(500, 500); }, 300);
      } else if (nextState === "active") OverlayModule?.hideOverlay();
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [isResultVisible, currentTheme]);

  useFocusEffect(useCallback(() => {
    isExiting.current = false; 
    return () => { isExiting.current = true; OverlayModule?.hideOverlay(); };
  }, []));

  if (model.state !== 'loaded') return <View style={styles.loading}><ActivityIndicator size="large" color="#ffffff" /></View>;

  return (
    <View style={styles.container}>
      <Camera style={StyleSheet.absoluteFill} device={device!} isActive={!isResultVisible && !isExiting.current} frameProcessor={frameProcessor} pixelFormat="yuv" />
      {!isResultVisible && (
        <View style={styles.overlayContainer}>
          <Image source={require('../../../assets/common_IsStudent.png')} style={styles.studentImage} resizeMode="contain" />
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{studentStatus === "FOCUS" ? "선생님 말씀에 집중 중! 🔥" : "자리를 비우셨나요? 👀"}</Text>
          </View>
        </View>
      )}
      <ClassResultModal visible={isResultVisible} onClose={() => router.replace('/screens/Student_Home')} focusRate={resultData.focusRate} currentXP={resultData.currentXP} maxXP={resultData.maxXP} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  overlayContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center' },
  studentImage: { width: '70%', height: '50%' },
  statusBox: { marginTop: 30, backgroundColor: 'white', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, elevation: 10, borderWidth: 2, borderColor: '#4A90E2' },
  statusText: { fontSize: 18, fontWeight: 'bold', color: '#333' }
}); 