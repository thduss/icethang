import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, AppState, NativeModules, Text, ActivityIndicator } from "react-native";
import { Camera, useCameraDevice, useFrameProcessor, useCameraPermission } from "react-native-vision-camera";
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useSharedValue, Worklets } from 'react-native-worklets-core';
import PipHandler, { usePipModeListener } from 'react-native-pip-android';
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSelector, useDispatch } from "react-redux";

import TrafficLight from "../../components/TrafficLight";
import ClassResultModal from "../../components/ClassResultModal";
import LevelUpRewardModal from "../../components/LevelUpRewardModal";

import { stompClient } from "../../utils/socket";
import { SOCKET_CONFIG } from "../../api/socket";
import { RootState } from "../../store/stores";

const { OverlayModule } = NativeModules;

const charMap: Record<string, string> = { "1": "char_1", "2": "char_2", "3": "char_3", "4": "char_4", "5": "char_5", "6": "char_6", "7": "char_7", "8": "char_8" };
const bgMap: Record<string, string> = { "1": "background1", "2": "background2", "3": "background3", "4": "background4" };

const YAW_THRESHOLD = 0.22;     
const EAR_THRESHOLD = 0.12;     
const MOVEMENT_THRESHOLD = 15;

export default function DigitalClassScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { classId } = useLocalSearchParams<{ classId: string }>(); 
  const inPipMode = usePipModeListener(); 
  const appState = useRef(AppState.currentState);
  
  // 상태 데이터 
  const themeState = useSelector((state: RootState) => state.theme) as any;
  const authState = useSelector((state: RootState) => state.auth) as any;
  
  const equippedCharacterId = themeState?.equippedCharacterId;
  const equippedBackgroundId = themeState?.equippedBackgroundId;
  const user = authState?.user; 
  const deviceUuid = authState?.deviceUuid || authState?.token; 

  //  [AI 설정]
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const model = useTensorflowModel(require('../../../assets/face_landmarker.tflite'));
  const { resize } = useResizePlugin();

  //  [상태 관리]
  const [studentStatus, setStudentStatus] = useState<string>("FOCUS");
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [isLevelUpVisible, setIsLevelUpVisible] = useState(false);
  const [hasLevelUpData, setHasLevelUpData] = useState(false);
  const [resultData, setResultData] = useState({ gainedXP: 0, currentXP: 0, maxXP: 100 });
  const [isLoadingXP, setIsLoadingXP] = useState(false);

  const [theme, setTheme] = useState({ 
    character: charMap[String(equippedCharacterId)] || "char_1", 
    background: bgMap[String(equippedBackgroundId)] || "background1" 
  });

  // AI 공유 변수
  const frameCounter = useSharedValue(0);
  const lastNoseX = useSharedValue(0);
  const lastNoseY = useSharedValue(0);
  const movementScore = useSharedValue(0);

  // 이슈 전송  + 오버레이 갱신
  const setStatusJS = Worklets.createRunOnJS((status: string) => {
    if (studentStatus !== status) {
      setStudentStatus(status);

      // 1. 서버로 이슈 실시간 전송
      if (stompClient?.connected) {
        stompClient.publish({
          destination: `/pub/class/${classId}/status`,
          body: JSON.stringify({
            studentId: user?.id,
            deviceUuid: deviceUuid,
            type: status,
            timestamp: new Date().toISOString()
          }),
        });
        console.log(`📤 [서버전송] ${user?.name || '학생'}님 상태: ${status}`);
      }

      // 2. PiP 모드 오버레이 색상 업데이트
      if (OverlayModule?.updateOverlayStatus) {
        OverlayModule.updateOverlayStatus(status);
      }
    }
  });

  useEffect(() => { if (!hasPermission) requestPermission(); }, [hasPermission]);

  // [AI 분석] - 생략 없이 복구
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
        const diff = Math.abs(noseX - lastNoseX.value) + Math.abs(noseY - lastNoseY.value);
        lastNoseX.value = noseX;
        lastNoseY.value = noseY;
        
        if (diff > 2) movementScore.value = Math.min(30, movementScore.value + 1.2);
        else movementScore.value = Math.max(0, movementScore.value - 1.8);

        const leftEAR = (Math.abs(landmarks[159*3+1] - landmarks[145*3+1])) / (Math.abs(landmarks[33*3] - landmarks[133*3]));
        const faceWidth = Math.abs(landmarks[454*3] - landmarks[234*3]);
        const yawRatio = (noseX - landmarks[234*3]) / faceWidth;

        let newStatus = "FOCUS";
        if (Math.abs(yawRatio - 0.5) > YAW_THRESHOLD) newStatus = "UNFOCUS";
        else if (leftEAR < EAR_THRESHOLD) newStatus = "SLEEPING";
        else if (movementScore.value > MOVEMENT_THRESHOLD) newStatus = "UNFOCUS";

        setStatusJS(newStatus);
      } else {
        setStatusJS("AWAY");
        movementScore.value = 0;
      }
    }
  }, [model, setStatusJS]);

  // [소켓/API] 수업 종료 처리 (deviceUuid로 인증)
  const handleClassEnd = async () => {
    if (OverlayModule) OverlayModule.hideOverlay();
    setIsLoadingXP(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // 정산 대기

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/user/me`, {
        headers: { 
          'Authorization': `Bearer ${deviceUuid}`,
          'Device-UUID': deviceUuid 
        }
      });
      const latestUser = await response.json();

      const prevXP = user?.currentXp || 0;
      const prevLevel = user?.currentLevel || 1;
      const newXP = latestUser.currentXp || 0;
      const newLevel = latestUser.currentLevel || 1;

      setResultData({
        gainedXP: newLevel > prevLevel ? (100 - prevXP) + newXP : newXP - prevXP,
        currentXP: newXP,
        maxXP: latestUser.maxXP || 100
      });

      setHasLevelUpData(newLevel > prevLevel);
      setIsResultVisible(true);
    } catch (error) {
      console.error("경험치 조회 실패:", error);
      setIsResultVisible(true); 
    } finally {
      setIsLoadingXP(false);
    }
  };

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
          handleClassEnd();
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
    return () => { 
      if (subs) { subs.modeSub.unsubscribe(); subs.classSub.unsubscribe(); } 
      OverlayModule?.hideOverlay(); 
    };
  }, [classId, inPipMode]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current === "active" && nextAppState.match(/inactive|background/)) {
        if (!inPipMode && !isResultVisible) {
          OverlayModule?.showOverlay("수업에 집중하고 있어요!", false, theme.character, theme.background, 0, 0);
          PipHandler.enterPipMode(500, 500);
        }
      } else if (nextAppState === "active") {
        OverlayModule?.hideOverlay();
      }
      appState.current = nextAppState;
    });
    return () => sub.remove();
  }, [inPipMode, isResultVisible, theme]);

  if (model.state !== 'loaded' || isLoadingXP) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>{isLoadingXP ? "성적 정산 중..." : "AI 모델 로딩 중..."}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.hiddenCamera} device={device!} isActive={!isResultVisible} frameProcessor={frameProcessor} pixelFormat="yuv" />
      
      <View style={styles.content}>
        <TrafficLight size={inPipMode ? "small" : "large"} status={studentStatus} />
        <Text style={styles.mainStatusText}>
          {studentStatus === "FOCUS" ? "훌륭해요! 계속 집중하세요" : 
           studentStatus === "AWAY" ? "어디 갔나요? 화면 앞으로 돌아오세요" : "조금 더 집중해볼까요?"}
        </Text>
      </View>

      <ClassResultModal 
        visible={isResultVisible} 
        gainedXP={resultData.gainedXP} 
        currentXP={resultData.currentXP} 
        maxXP={resultData.maxXP} 
        isLevelUp={hasLevelUpData} 
        onClose={() => {
          setIsResultVisible(false);
          if (hasLevelUpData) setIsLevelUpVisible(true);
          else router.replace('/screens/Student_Home');
      }} />
      <LevelUpRewardModal visible={isLevelUpVisible} onClose={() => router.replace('/screens/Student_Home')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFCF0' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFCF0' },
  loadingText: { marginTop: 15, fontSize: 16, color: '#666', fontWeight: '600' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 },
  hiddenCamera: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  mainStatusText: { marginTop: 30, fontSize: 20, fontWeight: 'bold', color: '#444', textAlign: 'center' }
});