import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, AppState, Platform, NativeModules, Text, ActivityIndicator } from "react-native";
import { Camera, useCameraDevice, useFrameProcessor, useCameraPermission } from "react-native-vision-camera";
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useSharedValue, Worklets } from 'react-native-worklets-core';
import PipHandler, { usePipModeListener } from 'react-native-pip-android';
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";

import TrafficLight from "../../components/TrafficLight";
import ClassResultModal from "../../components/ClassResultModal";
import LevelUpRewardModal from "../../components/LevelUpRewardModal";

import { stompClient } from "../../utils/socket";
import { SOCKET_CONFIG } from "../../api/socket";
import { RootState } from "../../store/stores";

const { OverlayModule } = NativeModules;

// 매핑 테이블 
const charMap: Record<string, string> = {
  "1": "char_1", "2": "char_2", "3": "char_3", "4": "char_4",
  "5": "char_5", "6": "char_6", "7": "char_7", "8": "char_8"
};

const bgMap: Record<string, string> = {
  "1": "background1", "2": "background2", "3": "background3", "4": "background4"
};

const YAW_THRESHOLD = 0.22;     
const EAR_THRESHOLD = 0.12;     
const MOVEMENT_THRESHOLD = 15;  
export default function DigitalClassScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>(); 
  const inPipMode = usePipModeListener();
  const appState = useRef(AppState.currentState);
  
  const { equippedCharacterId, equippedBackgroundId } = useSelector((state: RootState) => state.theme);

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const model = useTensorflowModel(require('../../../assets/face_landmarker.tflite'));
  const { resize } = useResizePlugin();

  const [studentStatus, setStudentStatus] = useState<string>("FOCUS");
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [isLevelUpVisible, setIsLevelUpVisible] = useState(false);
  const [hasLevelUpData, setHasLevelUpData] = useState(false);
  const [resultData, setResultData] = useState({ gainedXP: 0, currentXP: 0, maxXP: 100 });

  const [theme, setTheme] = useState({
    character: charMap[String(equippedCharacterId)] || "char_1",
    background: bgMap[String(equippedBackgroundId)] || "background1"
  });

  // AI 연산용 공유 변수
  const frameCounter = useSharedValue(0);
  const lastNoseX = useSharedValue(0);
  const lastNoseY = useSharedValue(0);
  const movementScore = useSharedValue(0);

  //  스레드 통신 함수
  const setStatusJS = Worklets.createRunOnJS((status: string) => {
    if (studentStatus !== status) {
      setStudentStatus(status);
      if (OverlayModule?.updateOverlayStatus) {
        OverlayModule.updateOverlayStatus(status);
      }
    }
  });

  useEffect(() => { if (!hasPermission) requestPermission(); }, [hasPermission]);

  //  [AI 분석 로직 개선 버전]
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (model.state !== 'loaded') return;

    frameCounter.value += 1;
    if (frameCounter.value % 5 !== 0) return; 

    const resized = resize(frame, { scale: { width: 192, height: 192 }, pixelFormat: 'rgb', dataType: 'float32' });
    const outputs = model.model.runSync([resized]);
    
    if (outputs && outputs.length > 0) {
      const landmarks = outputs[0] as Float32Array;

      if (landmarks.length > 100) {
        const noseX = landmarks[1 * 3];
        const noseY = landmarks[1 * 3 + 1];

        // 1. 움직임(산만함) 계산
        const diff = Math.abs(noseX - lastNoseX.value) + Math.abs(noseY - lastNoseY.value);
        lastNoseX.value = noseX;
        lastNoseY.value = noseY;
        
        if (diff > 2) movementScore.value = Math.min(30, movementScore.value + 1.5);
        else movementScore.value = Math.max(0, movementScore.value - 1.0);

        // 2. 졸음(EAR) 및 시선(Yaw) 계산
        const leftEAR = (Math.abs(landmarks[159*3+1] - landmarks[145*3+1])) / (Math.abs(landmarks[33*3] - landmarks[133*3]));
        const faceWidth = Math.abs(landmarks[454*3] - landmarks[234*3]);
        const yawRatio = (noseX - landmarks[234*3]) / faceWidth;

        let newStatus = "FOCUS";
        if (Math.abs(yawRatio - 0.5) > YAW_THRESHOLD) newStatus = "UNFOCUS";
        else if (leftEAR < EAR_THRESHOLD) newStatus = "SLEEPING";
        else if (movementScore.value > MOVEMENT_THRESHOLD) newStatus = "UNFOCUS";

        console.log(
          `📊 [AI 분석] 상태: ${newStatus} | ` +
          `👁️ 눈(EAR): ${leftEAR.toFixed(3)} (기준: ${EAR_THRESHOLD}) | ` +
          `↔️ 시선(Yaw): ${(yawRatio - 0.5).toFixed(3)} (기준: ±${YAW_THRESHOLD}) | ` +
          `🏃 움직임: ${movementScore.value.toFixed(1)}`
        );

        setStatusJS(newStatus);
      } 
      else {
        console.log("⚠️ [AI 분석] 얼굴이 인식되지 않음 -> AWAY");
        setStatusJS("AWAY");
        movementScore.value = 0;
      }
    }
  }, [model, setStatusJS]);

  // 소켓 통신 (테마 변경 및 수업 종료)
  useEffect(() => {
    if (!classId) return;
    const setupSubscriptions = () => {
      const modeSub = stompClient.subscribe(SOCKET_CONFIG.SUBSCRIBE.MODE_STATUS(classId), (msg) => {
        const body = JSON.parse(msg.body);
        if (body.mode === 'NORMAL') {
          OverlayModule?.hideOverlay();
          router.replace('/screens/Classtime_Normal'); 
        }
      });

      const classSub = stompClient.subscribe(SOCKET_CONFIG.SUBSCRIBE.CLASS_TOPIC(classId), (msg) => {
        const body = JSON.parse(msg.body);
        if (body.type === 'CLASS_FINISHED' || body.type === 'END') {
          handleClassEnd(body);
        } 
        else if (body.type === 'THEME_CHANGED') {
          const newChar = charMap[String(body.characterId)] || "char_1";
          const newBg = bgMap[String(body.backgroundId)] || "background1";
          setTheme({ character: newChar, background: newBg });
          if (appState.current.match(/inactive|background/) || inPipMode) {
            OverlayModule?.showOverlay("테마가 변경되었습니다!", false, newChar, newBg, 0, 0);
          }
        }
      });
      return { modeSub, classSub };
    };

    let subs: any = null;
    if (stompClient.connected) subs = setupSubscriptions();
    return () => { if (subs) { subs.modeSub.unsubscribe(); subs.classSub.unsubscribe(); } };
  }, [classId, inPipMode]);

  const handleClassEnd = (body: any) => {
    if (OverlayModule) OverlayModule.hideOverlay();

    setResultData({
      gainedXP: body.gainedXP || 0,
      currentXP: body.currentXP || 0,
      maxXP: body.maxXP || 100
    });

    setHasLevelUpData(!!body.levelUp); 

    setIsResultVisible(true);
  };

  //  앱 상태에 따른 오버레이 팝업
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current === "active" && nextAppState.match(/inactive|background/)) {
        if (!inPipMode && !isResultVisible) {
          OverlayModule?.showOverlay(
            "수업에 집중하고 있어요!", 
            false, 
            theme.character, 
            theme.background, 
            0, 0
          );
          PipHandler.enterPipMode(500, 500);
        }
      } else if (nextAppState === "active") {
        OverlayModule?.hideOverlay();
      }
      appState.current = nextAppState;
    });
    return () => sub.remove();
  }, [inPipMode, isResultVisible, theme]);

  if (model.state !== 'loaded') return <View style={styles.loading}><ActivityIndicator size="large"/><Text>AI 모델 로딩 중...</Text></View>;

  return (
    <View style={styles.container}>
      <Camera style={StyleSheet.absoluteFill} device={device!} isActive={!isResultVisible} frameProcessor={frameProcessor} pixelFormat="yuv" />
      <View style={styles.content}>
        <TrafficLight size={inPipMode ? "small" : "large"} status={studentStatus} />
      </View>
      <ClassResultModal visible={isResultVisible} gainedXP={resultData.gainedXP} currentXP={resultData.currentXP} maxXP={resultData.maxXP} isLevelUp={hasLevelUpData} onClose={() => {
          setIsResultVisible(false);
          if (hasLevelUpData) setIsLevelUpVisible(true);
          else router.replace('/screens/Student_Home');
      }} />
      <LevelUpRewardModal visible={isLevelUpVisible} onClose={() => router.replace('/screens/Student_Home')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});