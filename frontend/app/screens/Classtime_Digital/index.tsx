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
const EYE_AR_THRESHOLD = 0.15;

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

export default function DigitalClassScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>(); 
  const isExiting = useRef(false);
  const appState = useRef(AppState.currentState);
  
  const authState = useSelector((state: RootState) => state.auth) as any;
  const themeState = useSelector((state: RootState) => state.theme) as any;
  const user = authState?.user;

  const [studentStatus, setStudentStatus] = useState<string>("FOCUS");
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [isLevelUpVisible, setIsLevelUpVisible] = useState(false);
  const [hasLevelUpData, setHasLevelUpData] = useState(false);
  const [resultData, setResultData] = useState({ focusRate: 0, currentXP: 0, maxXP: 100 });

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


  useEffect(() => {
    if (!stompClient || !stompClient.connected) return;

    const subscription = stompClient.subscribe(`/topic/class/${classId}`, (msg) => {
        const body = JSON.parse(msg.body);
        console.log("📩 [Socket]:", body.type, body.mode);

        const wakeApp = () => {
            isExiting.current = true; 
            OverlayModule?.hideOverlay(); 
            OverlayModule?.relaunchApp(); 
        };

        if (body.type === 'CLASS_FINISHED') {
            wakeApp();
            setTimeout(() => fetchClassResult(), 1000);
        }
        else if (
            body.type === 'START_NORMAL_CLASS' || 
            body.type === 'SWITCH_TO_NORMAL' ||
            (body.type === 'CHANGE_MODE' && body.mode === 'NORMAL') 
        ) {
            console.log("🏫 일반 수업으로 이동 (Digital -> Normal)");
            wakeApp();
            
            setTimeout(() => {
                router.replace({
                  pathname: '/screens/Classtime_Normal',
                  params: { classId: classId }
                });
            }, 1000);
        }
    });

    return () => subscription.unsubscribe();
  }, [classId]);

  useFocusEffect(
    useCallback(() => {
      isExiting.current = false;
      return () => {
        isExiting.current = true;
        OverlayModule?.hideOverlay();
      };
    }, [])
  );

  const setStatusJS = Worklets.createRunOnJS((newStatus: string, details: string) => {
    if (isExiting.current) return;
    
    if (prevStatusRef.current !== newStatus) {
      console.log(`🤖 [AI]: ${newStatus} | ${details}`);
      prevStatusRef.current = newStatus;
      setStudentStatus(newStatus);
      
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


  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (model.state !== 'loaded' || isExiting.current) return;

    const resized = resize(frame, { scale: { width: 192, height: 192 }, pixelFormat: 'rgb', dataType: 'float32' });
    const outputs = model.model.runSync([resized]);

    let isFaceDetected = false;
    if (outputs.length > 1) {
      const scores = outputs[1] as Float32Array;
      if (scores[0] > MIN_FACE_SCORE) isFaceDetected = true;
    } else if (outputs.length > 0 && (outputs[0] as Float32Array).length > 100) {
       isFaceDetected = true;
    }

    if (!isFaceDetected) {
      setStatusJS("AWAY", "자리 이탈");
      return;
    }

    const landmarks = outputs[0] as Float32Array;
    const noseX = landmarks[IDX.NOSE_TIP * 3];
    
    const leftEAR = calcEAR(landmarks, IDX.LEFT_EYE);
    const rightEAR = calcEAR(landmarks, IDX.RIGHT_EYE);
    const avgEar = (leftEAR + rightEAR) / 2.0;
    
    const faceLeftX = landmarks[234 * 3]; 
    const faceRightX = landmarks[454 * 3]; 
    const faceWidth = Math.abs(faceRightX - faceLeftX);
    const yawVal = Math.abs((noseX - faceLeftX) / faceWidth - 0.5);

    let status = "FOCUS";
    let detail = "집중 중";

    if (yawVal > 0.20) { 
        status = "UNFOCUS";
        detail = "시선 이탈";
    } else if (avgEar < 0.12) { 
        status = "SLEEPING";
        detail = "졸음 감지";
    }

    setStatusJS(status, detail);
  }, [model]);

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
      <Camera 
        style={StyleSheet.absoluteFill} 
        device={device!} 
        isActive={!isResultVisible} 
        frameProcessor={frameProcessor} 
        pixelFormat="yuv" 
      />

      <View style={styles.coverOverlay}>
         <Image 
           source={require('../../../assets/common_IsStudent.png')} 
           style={styles.coverImage} 
           resizeMode="cover"
         />
      </View>
      
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
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999, 
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
});