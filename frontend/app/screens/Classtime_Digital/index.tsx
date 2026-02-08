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
// [무조건 포함] 정밀 AI Constants
// ==========================================
const GAZE_RATIO_TH_X = 0.20;
const GAZE_RATIO_TH_Y = 0.15;
const GAZE_CORRECTION_YAW = 0.015;
const GAZE_CORRECTION_PITCH = 0.002;
const DEFAULT_EAR_THRESHOLD = 0.12;
const EYE_CLOSED_TIME_LIMIT = 2000;
const MOVEMENT_THRESHOLD = 2.0;
const MOVEMENT_TRIGGER_COUNT = 5;
const CALIBRATION_FRAMES = 30;
const MIN_FACE_SCORE = -4.0;
const AWAY_FRAME_LIMIT = 30;

const IDX = {
  NOSE_TIP: 1, CHIN: 152, LEFT_EYE_OUTER: 33, RIGHT_EYE_OUTER: 263, FOREHEAD: 10,
  LEFT_EYE: [159, 145, 33, 133, 158, 153], RIGHT_EYE: [386, 374, 362, 263, 385, 380],
  LEFT_IRIS: 468, RIGHT_IRIS: 473, LEFT_EYE_BOX: [33, 133, 159, 145], RIGHT_EYE_BOX: [362, 263, 386, 374]
};

export default function DigitalClassScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // ✅ classId 안정성 확보 (Redux 백업)
  const studentData = useSelector((state: RootState) => state.auth.studentData);
  const classId = (params.classId as string) || studentData?.classId?.toString();
  
  const isExiting = useRef(false);
  const appState = useRef(AppState.currentState);
  const user = useSelector((state: RootState) => state.auth.user);
  const themeState = useSelector((state: RootState) => state.theme) as any;

  const [studentStatus, setStudentStatus] = useState<string>("FOCUS");
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [resultData, setResultData] = useState({ focusRate: 0, currentXP: 0, maxXP: 100 });

  // AI Shared Values
  const isCalibrated = useSharedValue(false);
  const calibrationData = useSharedValue<number[]>([]);
  const prevStatusRef = useRef<string>("FOCUS");
  const lastHeadPose = useSharedValue<[number, number, number]>([0, 0, 0]);
  const movementCounter = useSharedValue(0);
  const baseline = useSharedValue<number[]>([0, 0, 0, 0, 0]);
  const eyeClosedStart = useSharedValue<number | null>(null);
  const personalEarThreshold = useSharedValue(DEFAULT_EAR_THRESHOLD);

  const currentTheme = useMemo(() => ({
    character: charMap[String(themeState?.equippedCharacterId)] || "char_1",
    background: bgMap[String(themeState?.equippedBackgroundId)] || "background1"
  }), [themeState]);

  // 1. 수업 종료 및 일반 모드 전환 통합 처리
  const handleTransition = useCallback((type: 'FINISHED' | 'NORMAL', data?: any) => {
    if (isExiting.current) return;
    isExiting.current = true;

    // 네이티브 오버레이 제거 및 전체 화면 복구
    OverlayModule?.hideOverlay();
    OverlayModule?.relaunchApp(); 

    if (type === 'FINISHED' && data) {
      setResultData({
        focusRate: data.focusRate || 0,
        currentXP: data.currentXP || 0,
        maxXP: data.maxXP || 100
      });
      setTimeout(() => setIsResultVisible(true), 800);
    } else {
      // ✅ 일반 모드로 즉시 전환 (타이밍 조절)
      setTimeout(() => {
        router.replace({
          pathname: "/screens/Classtime_Normal",
          params: { classId: classId }
        });
      }, 700);
    }
  }, [classId]);

  // 2. AI 상태 전송 (Worklet)
  const setStatusJS = Worklets.createRunOnJS((newStatus: string) => {
    if (isExiting.current || isResultVisible || !classId || classId === "undefined") return;

    if (prevStatusRef.current !== newStatus) {
      prevStatusRef.current = newStatus;
      setStudentStatus(newStatus);

      if (stompClient?.connected) {
        stompClient.publish({
          destination: `/pub/class/${classId}/status`,
          body: JSON.stringify({
            classId: Number(classId),
            studentId: user?.id,
            studentName: user?.name,
            type: newStatus,
            detectedAt: new Date().toISOString()
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
    if (model.state !== 'loaded' || isExiting.current || isResultVisible) return;

    const resized = resize(frame, { scale: { width: 192, height: 192 }, pixelFormat: 'rgb', dataType: 'float32' });
    const outputs = model.model.runSync([resized]);

    if (outputs && outputs.length > 0) {
      const landmarks = outputs[0] as Float32Array;
      if (landmarks && landmarks.length > 100) {
        const noseX = landmarks[IDX.NOSE_TIP * 3];
        const faceWidth = Math.abs(landmarks[454 * 3] - landmarks[234 * 3]);
        const yaw = ((noseX - landmarks[234 * 3]) / faceWidth - 0.5) * 50;

        if (!isCalibrated.value) {
          const newData = [...calibrationData.value, yaw];
          calibrationData.value = newData;
          if (newData.length >= CALIBRATION_FRAMES) isCalibrated.value = true;
          return;
        }

        let status = "FOCUS";
        if (Math.abs(yaw) > 15) status = "UNFOCUS";
        setStatusJS(status);
      } else {
        setStatusJS("AWAY");
      }
    }
  }, [model, isResultVisible, classId]);

  // 3. 소켓 구독 및 모드 변경 감지
  useEffect(() => {
    let classSub: any = null;
    let modeSub: any = null;

    if (!classId || classId === "undefined") return;

    const setup = () => {
      // [A] 수업 종료 감지
      classSub = stompClient.subscribe(`/topic/class/${classId}`, (msg) => {
        const body = JSON.parse(msg.body);
        if (body.type === 'CLASS_FINISHED') handleTransition('FINISHED', body);
      });

      // [B] 모드 변경 감지 (NORMAL 수신 시)
      modeSub = stompClient.subscribe(`/topic/class/${classId}/mode`, (msg) => {
        const body = JSON.parse(msg.body);
        if (body.mode === 'NORMAL') handleTransition('NORMAL');
      });
    };

    if (stompClient.connected) setup();
    else stompClient.onConnect = setup;

    return () => {
      if (classSub) classSub.unsubscribe();
      if (modeSub) modeSub.unsubscribe();
    };
  }, [classId, handleTransition]);

  // PiP 제어 및 화면 상태 관리
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (isExiting.current || isResultVisible) {
        OverlayModule?.hideOverlay();
        return;
      }
      if (appState.current === "active" && nextState.match(/inactive|background/)) {
        OverlayModule?.showOverlay("집중도 측정 중", false, currentTheme.character, currentTheme.background, 0, 0);
        setTimeout(() => { 
          if (!isExiting.current && !isResultVisible) PipHandler.enterPipMode(500, 500); 
        }, 300);
      } else if (nextState === "active") {
        OverlayModule?.hideOverlay();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [isResultVisible, currentTheme]);

  // ✅ 화면 진입 시 플래그 초기화 (전환 루프 해결 핵심)
  useFocusEffect(useCallback(() => {
    isExiting.current = false; 
    return () => { 
      isExiting.current = true; 
      OverlayModule?.hideOverlay(); 
    };
  }, []));

  if (model.state !== 'loaded') return <View style={styles.loading}><ActivityIndicator size="large" color="#ffffff" /></View>;

  return (
    <View style={styles.container}>
      <Camera 
        style={StyleSheet.absoluteFill} 
        device={device!} 
        isActive={!isResultVisible && !isExiting.current} 
        frameProcessor={frameProcessor} 
        pixelFormat="yuv" 
      />

      {!isResultVisible && (
        <View style={styles.overlayContainer}>
          <Image source={require('../../../assets/common_IsStudent.png')} style={styles.studentImage} resizeMode="contain" />
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>
              {studentStatus === "FOCUS" ? "선생님 말씀에 집중 중! 🔥" : "자리를 비우셨나요? 👀"}
            </Text>
          </View>
        </View>
      )}

      <ClassResultModal 
        visible={isResultVisible} 
        onClose={() => router.replace('/screens/Student_Home')} 
        focusRate={resultData.focusRate} 
        currentXP={resultData.currentXP} 
        maxXP={resultData.maxXP} 
      />
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