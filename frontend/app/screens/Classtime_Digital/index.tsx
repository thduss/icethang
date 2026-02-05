import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { View, StyleSheet, AppState, NativeModules, ActivityIndicator } from "react-native";
import { Camera, useCameraDevice, useFrameProcessor, useCameraPermission } from "react-native-vision-camera";
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useSharedValue, Worklets } from 'react-native-worklets-core';
import PipHandler, { usePipModeListener } from 'react-native-pip-android';
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSelector } from "react-redux";

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
  const isExiting = useRef(false);
  const appState = useRef(AppState.currentState);
  
  const authState = useSelector((state: RootState) => state.auth) as any;
  const themeState = useSelector((state: RootState) => state.theme) as any;
  const user = authState?.user;

  const [studentStatus, setStudentStatus] = useState<string>("FOCUS");
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [isLevelUpVisible, setIsLevelUpVisible] = useState(false);
  const [hasLevelUpData, setHasLevelUpData] = useState(false);
  const [resultData, setResultData] = useState({ gainedXP: 0, currentXP: 0, maxXP: 100 });

  const currentTheme = useMemo(() => ({
    character: charMap[String(themeState?.equippedCharacterId)] || "char_1",
    background: bgMap[String(themeState?.equippedBackgroundId)] || "background1"
  }), [themeState]);

  // 🚨 페이지 이탈(이동) 시 즉시 오버레이 삭제
  useFocusEffect(
    useCallback(() => {
      isExiting.current = false;
      return () => {
        console.log("🏃 [이탈] 페이지를 떠납니다. 오버레이를 강제로 끕니다.");
        isExiting.current = true;
        OverlayModule?.hideOverlay(); // 즉시 호출
      };
    }, [])
  );

  const setStatusJS = Worklets.createRunOnJS((newStatus: string, details: string) => {
    if (isExiting.current) return;
    
    // 🔍 [AI LOG] 터미널에서 실시간 수치 확인
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
  const model = useTensorflowModel(require('../../../assets/face_landmarker.tflite'));
  const { resize } = useResizePlugin();

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (model.state !== 'loaded' || isExiting.current) return;
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
        setStatusJS("AWAY", "인식 불가");
      }
    }
  }, [model]);

  useEffect(() => {
    if (!classId || !stompClient.connected) return;
    const classSub = stompClient.subscribe(`/topic/class/${classId}`, (msg) => {
      const body = JSON.parse(msg.body);
      if (['CLASS_FINISHED', 'END', 'FINISH', 'STOP'].includes(body.type)) {
        isExiting.current = true;
        OverlayModule?.hideOverlay(); // 수업 종료 시 삭제
        setResultData({ gainedXP: body.gainedXP || 0, currentXP: body.currentXP || 0, maxXP: body.maxXP || 100 });
        setHasLevelUpData(!!body.levelUp);
        setIsResultVisible(true);
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
      <Camera style={StyleSheet.absoluteFill} device={device!} isActive={!isResultVisible} frameProcessor={frameProcessor} pixelFormat="yuv" />
      
      <ClassResultModal 
        visible={isResultVisible} 
        onClose={() => {
          setIsResultVisible(false);
          if (hasLevelUpData) setIsLevelUpVisible(true);
          else router.replace('/screens/Student_Home');
        }} 
        gainedXP={resultData.gainedXP} 
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