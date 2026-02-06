import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { View, StyleSheet, AppState, NativeModules, ActivityIndicator, Text, Image, TouchableOpacity } from "react-native";
import { Camera, useCameraDevice, useFrameProcessor, useCameraPermission } from "react-native-vision-camera";
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useSharedValue, Worklets } from 'react-native-worklets-core';
import PipHandler from 'react-native-pip-android';
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSelector } from "react-redux";
import axios from 'axios';

import ClassResultModal from "../../components/ClassResultModal";
import LevelUpRewardModal from "../../components/LevelUpRewardModal";
import { stompClient } from "../../utils/socket";
import { RootState } from "../../store/stores";

const { OverlayModule } = NativeModules;

const charMap: Record<string, string> = { 
  "5": "char_1", "6": "char_2", "7": "char_3", "8": "char_4", 
  "9": "char_5", "10": "char_6", "11": "char_7", "12": "char_8",
  "13": "char_9", "14": "char_10", "15": "char_11", "16": "char_12"
};
const bgMap: Record<string, string> = { "1": "background1", "2": "background2", "3": "background3", "4": "background4" };

// ==========================================
// 1. AI Constants & Thresholds (최적화된 값)
// ==========================================
// [시선] 허용 범위
const GAZE_RATIO_TH_X = 0.20;
const GAZE_RATIO_TH_Y = 0.15;

// [시선 보정]
const GAZE_CORRECTION_YAW = 0.015;
const GAZE_CORRECTION_PITCH = 0.002;

// [졸음] 
const DEFAULT_EAR_THRESHOLD = 0.12; 
const EYE_CLOSED_TIME_LIMIT = 2000; 

// [움직임] 
const MOVEMENT_DEADZONE = 1.5; 
const POS_DIFF_SCALE = 1.0; 
const MOVEMENT_THRESHOLD = 2.0; 
const HEAD_MOVEMENT_TH = 1.5;

// [설정] 
const MOVEMENT_TRIGGER_COUNT = 5; 
const SMOOTHING_ALPHA = 0.15; 
const SMOOTHING_POS = 0.15; 
const CALIBRATION_FRAMES = 30; 
const BLINK_BUFFER_TIME = 1500;
const AWAY_FRAME_LIMIT = 30;
const MIN_FACE_SCORE = -4.0;
const EYE_AR_THRESHOLD = 0.15;

// Landmark
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
  LEFT_IRIS: 468,
  RIGHT_IRIS: 473,
  LEFT_EYE_BOX: [33, 133, 159, 145], 
  RIGHT_EYE_BOX: [362, 263, 386, 374]
};

// ==========================================
// 2. 계산
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

const calcGazeRatio = (landmarks: Float32Array) => {
  'worklet';
  const getX = (i: number) => landmarks[i * 3];
  const getY = (i: number) => landmarks[i * 3 + 1];

  const getRatio = (boxIdx: number[], irisIdx: number) => {
    const left = getX(boxIdx[0]);
    const right = getX(boxIdx[1]);
    const top = getY(boxIdx[2]);
    const bottom = getY(boxIdx[3]);
    
    const irisX = getX(irisIdx);
    const irisY = getY(irisIdx);

    const width = Math.abs(right - left);
    const height = Math.abs(bottom - top);

    const rX = width > 0 ? (irisX - left) / width : 0.5;
    const rY = height > 0 ? (irisY - top) / height : 0.5;
    return [rX, rY];
  };

  const leftR = getRatio(IDX.LEFT_EYE_BOX, IDX.LEFT_IRIS);
  const rightR = getRatio(IDX.RIGHT_EYE_BOX, IDX.RIGHT_IRIS);

  return [(leftR[0] + rightR[0]) / 2, (leftR[1] + rightR[1]) / 2];
};

export default function NormalClassScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>(); 
  const isExiting = useRef(false);
  const appState = useRef(AppState.currentState);
  
  const authState = useSelector((state: RootState) => state.auth) as any;
  const themeState = useSelector((state: RootState) => state.theme) as any;
  const user = authState?.user;

  const [studentStatus, setStudentStatus] = useState<string>("FOCUS");
  // const [debugMsg, setDebugMsg] = useState("");
  
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [isLevelUpVisible, setIsLevelUpVisible] = useState(false);
  const [hasLevelUpData, setHasLevelUpData] = useState(false);
  const [resultData, setResultData] = useState({ focusRate: 0, currentXP: 0, maxXP: 100 });

  // ==========================================
  // 3. AI
  // ==========================================
  const prevHeadPose = useSharedValue<[number, number, number] | null>(null);
  const prevGaze = useSharedValue<[number, number] | null>(null);
  
  const isCalibrated = useSharedValue(false);
  const calibrationData = useSharedValue<number[]>([]);
  const baseline = useSharedValue<number[]>([0, 0, 0, 0, 0]); // Yaw, Pitch, Roll, GazeX, GazeY

  const faceMissingCount = useSharedValue(0);
  const lastBlinkTime = useSharedValue(0);
  const eyeClosedStart = useSharedValue<number | null>(null);
  
  const movementCounter = useSharedValue(0);
  const lastHeadPose = useSharedValue<[number, number, number]>([0,0,0]);
  
  const smoothedNosePos = useSharedValue<[number, number] | null>(null);
  const personalEarThreshold = useSharedValue(DEFAULT_EAR_THRESHOLD);

  // 이전 상태 기억하는 Ref 
  const prevStatusRef = useRef<string>("FOCUS");

  const currentTheme = useMemo(() => ({
    character: charMap[String(themeState?.equippedCharacterId)] || "char_1",
    background: bgMap[String(themeState?.equippedBackgroundId)] || "background1"
  }), [themeState]);

  const fetchClassResult = async () => {
    try {
      const response = await axios.get(`/api/class/${classId}/result/${user?.id}`);
      const data = response.data;

      setResultData({
        focusRate: data.focusRate || 0,
        currentXP: data.currentXP || 0,
        maxXP: data.maxXP || 100
      });
      setHasLevelUpData(!!data.levelUp);
      setIsResultVisible(true);
    } catch (error) {
      console.error("❌ 결과 조회 실패:", error);
      setIsResultVisible(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      isExiting.current = false;
      return () => {
        isExiting.current = true;
        OverlayModule?.hideOverlay();
      };
    }, [])
  );

  // =================================================================
  // Ref를 사용하여 상태 비교
  // =================================================================
  const setStatusJS = Worklets.createRunOnJS((newStatus: string, details: string) => {
    if (isExiting.current) return;
    
    // setDebugMsg(details);

    // Ref값과 비교하여 다를 때만 실행
    if (prevStatusRef.current !== newStatus) {
      console.log(`🤖 [AI 감지]: ${newStatus} | ${details}`);
      
      // 상태 즉시 업데이트
      prevStatusRef.current = newStatus;
      setStudentStatus(newStatus);
      
      // 소켓 전송
      if (stompClient?.connected) {
        const kst = new Date(new Date().getTime() + 32400000).toISOString().split('.')[0];
        stompClient.publish({
          destination: `/pub/class/${classId}/status`,
          body: JSON.stringify({ 
            classId: Number(classId), 
            studentId: user?.id, 
            studentName: user?.name, 
            type: newStatus, 
            detectedAt: kst 
          }),
        });
      }
      
      OverlayModule?.updateOverlayStatus(newStatus);
    }
  });

  const device = useCameraDevice('front');
  const model = useTensorflowModel(require('../../../assets/face_landmarker.tflite'));
  const { resize } = useResizePlugin();

  // 재보정 함수
  const resetCalibration = () => {
    console.log("🔄 재보정 시작 (Recalibrating...)");
    calibrationData.value = [];
    isCalibrated.value = false;
    // 상태 초기화 시 Ref도 같이 초기화
    prevStatusRef.current = "FOCUS"; 
    setStudentStatus("FOCUS");
  };

  // ==========================================
  // 4. Frame Processor (Advanced AI Logic)
  // ==========================================
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (model.state !== 'loaded' || isExiting.current) return;

    const resized = resize(frame, { scale: { width: 192, height: 192 }, pixelFormat: 'rgb', dataType: 'float32' });
    const outputs = model.model.runSync([resized]);

    // 1. AWAY Check
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
        setStatusJS("AWAY", "자리 이탈");
      }
      return;
    }
    faceMissingCount.value = 0;

    const landmarks = outputs[0] as Float32Array;
    const now = Date.now();

    // 2. Data Calculation
    const rawNoseX = landmarks[IDX.NOSE_TIP * 3];
    const rawNoseY = landmarks[IDX.NOSE_TIP * 3 + 1];
    
    const rawHead = calcHeadPose(landmarks);
    const rawGaze = calcGazeRatio(landmarks);
    
    const leftEar = calcEAR(landmarks, IDX.LEFT_EYE);
    const rightEar = calcEAR(landmarks, IDX.RIGHT_EYE);
    const avgEar = (leftEar + rightEar) / 2.0;
    
    // [보정값 사용]
    const eyesOpen = avgEar > personalEarThreshold.value;

    // 3. Smoothing
    let curHead = rawHead;
    let curGaze = rawGaze;
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

    if (prevGaze.value !== null) {
      curGaze = [
        SMOOTHING_ALPHA * rawGaze[0] + (1 - SMOOTHING_ALPHA) * prevGaze.value[0],
        SMOOTHING_ALPHA * rawGaze[1] + (1 - SMOOTHING_ALPHA) * prevGaze.value[1],
      ];
    }
    prevGaze.value = curGaze;

    if (smoothedNosePos.value !== null) {
      curNoseX = SMOOTHING_POS * rawNoseX + (1 - SMOOTHING_POS) * smoothedNosePos.value[0];
      curNoseY = SMOOTHING_POS * rawNoseY + (1 - SMOOTHING_POS) * smoothedNosePos.value[1];
    }

    // 4. Calibration (Baseline Collection)
    if (!isCalibrated.value) {
      const newData = [...calibrationData.value, curHead[0], curHead[1], curHead[2], curGaze[0], curGaze[1], avgEar];
      calibrationData.value = newData;
      smoothedNosePos.value = [curNoseX, curNoseY]; 

      if (newData.length >= CALIBRATION_FRAMES * 6) {
        let sums = [0, 0, 0, 0, 0, 0];
        const count = newData.length / 6;
        for (let i = 0; i < newData.length; i += 6) {
          sums[0] += newData[i];
          sums[1] += newData[i+1];
          sums[2] += newData[i+2];
          sums[3] += newData[i+3];
          sums[4] += newData[i+4];
          sums[5] += newData[i+5]; // EAR
        }
        
        // 기준값 설정 (Baseline)
        baseline.value = [sums[0]/count, sums[1]/count, sums[2]/count, sums[3]/count, sums[4]/count];
        
        // 눈 크기 임계값 설정
        let calculatedTh = (sums[5] / count) * 0.6;
        if (calculatedTh < 0.1) calculatedTh = 0.1;
        personalEarThreshold.value = calculatedTh;
        
        isCalibrated.value = true;
        setStatusJS("FOCUS", "보정 완료!");
      } else {
        return; 
      }
    }

    const [yaw, pitch, roll] = curHead;
    const [baseYaw, basePitch, baseRoll, baseGx, baseGy] = baseline.value;

    // 5. Logic: Correction & Checks
    const correctedGazeX = curGaze[0] + (yaw * GAZE_CORRECTION_YAW);
    const correctedGazeY = curGaze[1] + (pitch * GAZE_CORRECTION_PITCH);

    // Sleep Detection
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
    const isInBlinkBuffer = (now - lastBlinkTime.value) < BLINK_BUFFER_TIME;

    // Movement Detection
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

    if (totalMovement > MOVEMENT_THRESHOLD) {
      movementCounter.value += 1;
    } else {
      movementCounter.value = Math.max(0, movementCounter.value - 1);
    }
    const isMoving = movementCounter.value > MOVEMENT_TRIGGER_COUNT;

    // Gaze Detection
    const currentThX = GAZE_RATIO_TH_X + (Math.abs(yaw) * 0.005);
    const gazeDiffX = Math.abs(correctedGazeX - baseGx);
    const gazeDiffY = Math.abs(correctedGazeY - baseGy);
    
    let isGazeFocused = (gazeDiffX < currentThX && gazeDiffY < GAZE_RATIO_TH_Y);
    if (isInBlinkBuffer) isGazeFocused = true;

    // 6. Final Status Determination
    let status = "FOCUS";
    let detail = "";

    if (eyesTooLongClosed) {
      status = "UNFOCUS";
      detail = "졸음 감지";
    } else if (isMoving) {
      status = "UNFOCUS";
      detail = "움직임 감지";
    } else if (!isGazeFocused) {
      status = "UNFOCUS";
      detail = "시선 이탈";
    } else {
      status = "FOCUS";
      detail = "집중 중";
    }

    setStatusJS(status, detail);

  }, [model]);

  // 소켓 종료 신호 수신 로직 보강
  useEffect(() => {
    if (!classId || !stompClient.connected) return;

    const classSub = stompClient.subscribe(`/topic/class/${classId}`, (msg) => {
      const body = JSON.parse(msg.body);
      if (body.type === 'CLASS_FINISHED') {
        isExiting.current = true;
        OverlayModule?.hideOverlay(); 
        OverlayModule?.relaunchApp();
        setTimeout(() => { fetchClassResult(); }, 500);
      }
    });
    return () => classSub.unsubscribe();
  }, [classId]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (isExiting.current || isResultVisible) {
        OverlayModule?.hideOverlay();
        return;
      }
      if (appState.current === "active" && nextState.match(/inactive|background/)) {
        OverlayModule?.showOverlay("집중도 측정 중", false, currentTheme.character, currentTheme.background, 0, 0);
        setTimeout(() => { if (!isExiting.current) PipHandler.enterPipMode(500, 500); }, 300);
      } else if (nextState === "active") {
        OverlayModule?.hideOverlay();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [isResultVisible, currentTheme]);

  if (model.state !== 'loaded') return <View style={styles.loading}><ActivityIndicator size="large"/></View>;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        activeOpacity={1} 
        style={StyleSheet.absoluteFill} 
        onPress={resetCalibration}
      >
        <Camera style={StyleSheet.absoluteFill} device={device!} isActive={!isResultVisible} frameProcessor={frameProcessor} pixelFormat="yuv" />
      </TouchableOpacity>

      {!isCalibrated.value && (
        <View style={styles.overlayContainer}>
          <Text style={{color: 'cyan', fontSize: 18, fontWeight: 'bold'}}>
            ⚡ 정면을 응시하세요 (보정 중...)
          </Text>
        </View>
      )}

      {studentStatus !== "FOCUS" && studentStatus !== "AWAY" && (
        <View style={styles.overlayContainer}>
          <Image source={require('../../../assets/common_IsStudent.png')} style={styles.studentImage} resizeMode="contain" />
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>
              {studentStatus === "UNFOCUS" ? "집중해 볼까요! 🔥" : 
               studentStatus === "SLEEPING" ? "깜빡 졸고 있어요! 💤" : "자리를 비우셨나요? 👀"}
            </Text>
          </View>
        </View>
      )}
      
      <ClassResultModal 
        visible={isResultVisible} 
        onClose={() => {
          setIsResultVisible(false);
          if (hasLevelUpData) setIsLevelUpVisible(true);
          else router.replace('/screens/Student_Home');
        }} 
        focusRate={resultData.focusRate} 
        currentXP={resultData.currentXP} 
        maxXP={resultData.maxXP} 
      />

      <LevelUpRewardModal 
        visible={isLevelUpVisible} 
        onClose={() => {
          setIsLevelUpVisible(false);
          router.replace('/screens/Student_Home');
        }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentImage: {
    width: '70%',
    height: '50%',
  },
  statusBox: {
    marginTop: 20,
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 5,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
});