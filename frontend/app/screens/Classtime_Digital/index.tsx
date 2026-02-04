import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, AppState, Platform, NativeModules, Text } from "react-native";
import { Camera, useCameraDevice } from "react-native-vision-camera"; // 🚀 Vision Camera
import PipHandler, { usePipModeListener } from 'react-native-pip-android';
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";
import * as ImageManipulator from 'expo-image-manipulator'; // 🚀 리사이징용

import TrafficLight from "../../components/TrafficLight";
import ClassResultModal from "../../components/ClassResultModal";
import LevelUpModal from "../../components/LevelUpRewardModal"; // 🚀 레벨업 모달 추가 필요

import { stompClient } from "../../utils/socket";
import { SOCKET_CONFIG } from "../../api/socket";
import { RootState } from "../../store/stores";

const { OverlayModule } = NativeModules;

const charMap: Record<string, string> = {
  "1": "char_1", "2": "char_2", "3": "char_3", "4": "char_4",
  "5": "char_5", "6": "char_6", "7": "char_7", "8": "char_8"
};

const bgMap: Record<string, string> = {
  "1": "background1", "2": "background2", "3": "background3", "4": "background4"
};

export default function DigitalClassScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>(); 
  const inPipMode = usePipModeListener();
  const appState = useRef(AppState.currentState);
  const device = useCameraDevice('front');
  const camera = useRef<Camera>(null);
  const aiWs = useRef<WebSocket | null>(null); // 🚀 AI 서버용 웹소켓

  const { equippedCharacterId, equippedBackgroundId } = useSelector((state: RootState) => state.theme);

  const [isResultVisible, setIsResultVisible] = useState(false);
  const [isLevelUpVisible, setIsLevelUpVisible] = useState(false); // 🚀 레벨업 상태
  const [studentStatus, setStudentStatus] = useState<string>("FOCUS");
  const [isCameraReady, setIsCameraReady] = useState(false);

  const [theme, setTheme] = useState({
    character: charMap[String(equippedCharacterId)] || "char_1",
    background: bgMap[String(equippedBackgroundId)] || "background1"
  });

  // 1. AI 서버용 웹소켓 및 프레임 전송 루프
  useEffect(() => {
    // AI 서버 주소 (FastAPI/Flask 서버 IP)
  const serverUrl = process.env.EXPO_PUBLIC_AI_SERVER_URL;
  
  if (serverUrl) {
    aiWs.current = new WebSocket(serverUrl);
  }
    
    const interval = setInterval(async () => {
      if (camera.current && isCameraReady && aiWs.current?.readyState === WebSocket.OPEN && !isResultVisible) {
        try {
          // 📸 깜빡임 없는 스냅샷 추출
          const snapshot = await camera.current.takeSnapshot();
          
          // 📏 서버 부하를 줄이기 위한 320px 리사이징
          const resized = await ImageManipulator.manipulateAsync(
            `file://${snapshot.path}`,
            [{ resize: { width: 320 } }],
            { base64: true, format: ImageManipulator.SaveFormat.JPEG, compress: 0.7 }
          );

          if (resized.base64) {
            aiWs.current.send(resized.base64); // AI 서버 전송
          }
        } catch (err) {
          console.error("AI 프레임 추출 실패:", err);
        }
      }
    }, 500); // 0.5초 간격

    return () => {
      clearInterval(interval);
      aiWs.current?.close();
    };
  }, [isCameraReady, isResultVisible]);

  // 2. 소켓 구독 (수업 모드, 종료, 실시간 테마 변경)
  useEffect(() => {
    if (!classId) return;

    const setupSubscriptions = () => {
      // 모드 변경 구독
      const modeSub = stompClient.subscribe(SOCKET_CONFIG.SUBSCRIBE.MODE_STATUS(classId), (msg) => {
        const body = JSON.parse(msg.body);
        if (body.mode === 'NORMAL') {
          if (OverlayModule) OverlayModule.hideOverlay();
          router.replace('/screens/Classtime_Normal'); 
        }
      });

      // 수업 종료 및 상태 알림 구독
      const classSub = stompClient.subscribe(SOCKET_CONFIG.SUBSCRIBE.CLASS_TOPIC(classId), (msg) => {
        const body = JSON.parse(msg.body);
        
        if (body.type === 'CLASS_FINISHED' || body.type === 'END') {
          // 🚀 레벨업 데이터가 포함되어 있다면 로직 분기
          handleClassEnd(body);
        } 
        else if (['FOCUS', 'UNFOCUS', 'AWAY', 'SLEEPING'].includes(body.type)) {
          setStudentStatus(body.type);
        }
        else if (body.type === 'THEME_CHANGED') {
          const newChar = charMap[String(body.characterId)] || "char_1";
          const newBg = bgMap[String(body.backgroundId)] || "background1";
          setTheme({ character: newChar, background: newBg });
        }
      });

      return { modeSub, classSub };
    };

    let subs: { modeSub: any; classSub: any } | null = null;
    if (stompClient.connected) {
      subs = setupSubscriptions();
    } else {
      stompClient.onConnect = () => { subs = setupSubscriptions(); };
    }

    return () => {
      if (subs) {
        subs.modeSub.unsubscribe();
        subs.classSub.unsubscribe();
      }
    };
  }, [classId, inPipMode]);

  const handleClassEnd = (body: any) => {
    if (OverlayModule) OverlayModule.hideOverlay();
    if (Platform.OS === 'android') OverlayModule.relaunchApp();

    // 🚀 레벨업 체크 로직 (서버 데이터 기반)
    if (body.levelUp) {
      setIsLevelUpVisible(true);
    } else {
      setIsResultVisible(true);
    }
  };

  // 3. 앱 상태 변경 시 오버레이/PiP 제어
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current === "active" && nextAppState.match(/inactive|background/)) {
        if (Platform.OS === 'android' && !inPipMode && !isResultVisible) {
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

    return () => subscription.remove();
  }, [inPipMode, isResultVisible, theme]);

  if (!device) return <Text>카메라를 찾을 수 없습니다.</Text>;

  return (
    <View style={styles.container}>
      {/* 🚀 Vision Camera: 1x1 크기로 숨겨서 백그라운드 분석용으로 사용 */}
      <View style={styles.hiddenCamera}>
        <Camera
          ref={camera}
          device={device}
          isActive={!isResultVisible}
          photo={true}
          onInitialized={() => setIsCameraReady(true)}
        />
      </View>

      <View style={styles.content}>
        <TrafficLight size={inPipMode ? "small" : "large"} status={studentStatus} />
      </View>

      {/* 1. 수업 결과 모달 */}
      <ClassResultModal 
        visible={isResultVisible} 
        onClose={() => router.replace('/screens/Student_Home')}
        gainedXP={100} 
      />

      {/* 2. 레벨업 모달 (추가됨) */}
      <LevelUpModal 
        visible={isLevelUpVisible}
        onClose={() => {
          setIsLevelUpVisible(false);
          setIsResultVisible(true); // 레벨업 확인 후 결과 모달로 이동
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  hiddenCamera: { position: "absolute", width: 1, height: 1, opacity: 0, zIndex: -1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});