import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { View, StyleSheet, AppState, NativeModules, ActivityIndicator, Text } from "react-native";
import { Camera, useCameraDevice, useFrameProcessor, useCameraPermission } from "react-native-vision-camera";
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useSharedValue, Worklets } from 'react-native-worklets-core';
import PipHandler, { usePipModeListener } from 'react-native-pip-android';
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSelector } from "react-redux";
import axios from 'axios';

import ClassResultModal from "../../components/ClassResultModal";
import LevelUpRewardModal from "../../components/LevelUpRewardModal";
import { stompClient } from "../../utils/socket";
import { RootState } from "../../store/stores";

const { OverlayModule } = NativeModules;

const charMap: Record<string, string> = { "1": "char_1", "2": "char_2", "3": "char_3", "4": "char_4", "5": "char_5", "6": "char_6", "7": "char_7", "8": "char_8" };
const bgMap: Record<string, string> = { "1": "background1", "2": "background2", "3": "background3", "4": "background4" };

const YAW_THRESHOLD = 0.22;
const EAR_THRESHOLD = 0.12;

export default function DigitalClassScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>(); 
  const [isReady, setIsReady] = useState(false);
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

  const currentTheme = useMemo(() => ({
    character: charMap[String(themeState?.equippedCharacterId)] || "char_1",
    background: bgMap[String(themeState?.equippedBackgroundId)] || "background1"
  }), [themeState]);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const fetchClassResult = async () => {
    try {
      const response = await axios.get(`/api/class/${classId}/result/${user?.id}`);
      const data = response.data;
      setResultData({ focusRate: data.focusRate || 0, currentXP: data.currentXP || 0, maxXP: data.maxXP || 100 });
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
        console.log("🏃 [이탈] 오버레이 및 리소스 정리");
        isExiting.current = true;
        OverlayModule?.hideOverlay();
      };
    }, [])
  );

  const setStatusJS = Worklets.createRunOnJS((newStatus: string, details: string) => {
    if (isExiting.current) return;
    console.log(`🤖 [AI 분석]: ${newStatus} | ${details}`);
    
    if (studentStatus !== newStatus) {
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
  const model = useTensorflowModel(isReady ? require('../../../assets/face_landmarker.tflite') : null);
  const { resize } = useResizePlugin();

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (!isReady || model.state !== 'loaded' || isExiting.current) return;
    const resized = resize(frame, { scale: { width: 192, height: 192 }, pixelFormat: 'rgb', dataType: 'float32' });
    const outputs = model.model.runSync([resized]);

    if (outputs && outputs.length > 0) {
      const landmarks = outputs[0] as Float32Array;
      if (landmarks && landmarks.length > 100) {
        const noseX = landmarks[1 * 3];
        const leftEAR = (Math.abs(landmarks[159*3+1] - landmarks[145*3+1])) / (Math.abs(landmarks[33*3] - landmarks[133*3]));
        const faceWidth = Math.abs(landmarks[454*3] - landmarks[234*3]);
        const yawVal = Math.abs((noseX - landmarks[234*3]) / faceWidth - 0.5);

        let status = "FOCUS";
        if (yawVal > YAW_THRESHOLD) status = "UNFOCUS";
        else if (leftEAR < EAR_THRESHOLD) status = "SLEEPING";

        setStatusJS(status, `EAR: ${leftEAR.toFixed(2)}, Yaw: ${yawVal.toFixed(2)}`);
      } else {
        setStatusJS("AWAY", "얼굴 없음");
      }
    }
  }, [model, isReady]);

useEffect(() => {
  if (!isReady || !classId || !stompClient.connected) {
    console.log("⚠️ 소켓 구독 대기 중...", { isReady, classId, connected: stompClient.connected });
    return;
  }

  console.log(`✅ 수업 종료 신호 구독 시작: /topic/class/${classId}`);
  const classSub = stompClient.subscribe(`/topic/class/${classId}`, (msg) => {
    console.log("📩 [소켓 수신]:", msg.body);
    const body = JSON.parse(msg.body);

    if (body.type === 'CLASS_FINISHED') {
      console.log("🏁 CLASS_FINISHED 감지! 종료 프로세스 시작");
      
      // 1. 중복 실행 방지 및 카메라 중단
      isExiting.current = true;

      // 2. 네이티브 호출 (에러가 나도 다음 코드가 실행되도록 try-catch)
      try {
        OverlayModule?.hideOverlay();
        // relaunchApp이 정의되지 않았을 경우를 대비해 옵셔널 체이닝(?.) 사용
        OverlayModule?.relaunchApp?.(); 
      } catch (e) {
        console.warn("⚠️ 네이티브 호출 실패(무시하고 진행):", e);
      }

      // 3. 백엔드 데이터 매핑 (데이터가 없을 경우를 대비한 기본값 세팅)
      setResultData({
        focusRate: body.focusRate || 0,
        currentXP: body.currentXP || 0,
        maxXP: body.maxXP || 100
      });
      setHasLevelUpData(!!body.levelUp);

      // 4. 강제 모달 띄우기 (약간의 지연을 주어 UI 렌더링 확보)
      setTimeout(() => {
        console.log("✨ 결과 모달 표시 (setIsResultVisible -> true)");
        setIsResultVisible(true);
      }, 700);
    }
  });

  return () => {
    console.log("🚫 수업 종료 구독 해제");
    classSub.unsubscribe();
  };
}, [isReady, classId]);

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

  if (!isReady || model.state !== 'loaded') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera 
        style={StyleSheet.absoluteFill} 
        device={device!} 
        isActive={!isResultVisible && isReady} 
        frameProcessor={frameProcessor} 
        pixelFormat="yuv" 
      />
      
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
});