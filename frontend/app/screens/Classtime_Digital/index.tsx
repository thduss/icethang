import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, AppState, Platform, NativeModules } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import PipHandler, { usePipModeListener } from 'react-native-pip-android';
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux"; // 🚀 리덕스 연결

import TrafficLight from "../../components/TrafficLight";
import ClassResultModal from "../../components/ClassResultModal";

import { stompClient } from "../../utils/socket";
import { SOCKET_CONFIG } from "../../api/socket";
import { RootState } from "../../store/stores"; // 🚀 스토어 타입 임포트

const { OverlayModule } = NativeModules;

// 🚀 매핑 테이블: 서버 ID(숫자/문자) -> 안드로이드 drawable 파일명 (확장자 제외)
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
  
  // 🚀 [리덕스 확인] 현재 장착된 캐릭터와 배경 ID 가져오기
  const { equippedCharacterId, equippedBackgroundId } = useSelector((state: RootState) => state.theme);

  const [isResultVisible, setIsResultVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [studentStatus, setStudentStatus] = useState<string>("FOCUS");
  const [isCameraReady, setIsCameraReady] = useState(false);

  // 🚀 [초기값 설정] 리덕스 데이터를 매핑 테이블을 거쳐 drawable 이름으로 변환
  const [theme, setTheme] = useState({
    character: charMap[String(equippedCharacterId)] || "char_1",
    background: bgMap[String(equippedBackgroundId)] || "background1"
  });

  // 🔍 [디버깅 로그] 리덕스 데이터와 매핑 결과를 터미널에서 확인하세요.
  useEffect(() => {
    console.log("💎 [Redux Data] 캐릭터 ID:", equippedCharacterId, "/ 배경 ID:", equippedBackgroundId);
    console.log("🎨 [Mapped Name] 캐릭터:", theme.character, "/ 배경:", theme.background);
  }, [equippedCharacterId, equippedBackgroundId, theme]);

  // 1. 카메라 권한 및 지연 로딩
  useEffect(() => {
    if (!permission?.granted) requestPermission();
    const timer = setTimeout(() => setIsCameraReady(true), 1000);
    return () => clearTimeout(timer);
  }, [permission]);

  // 2. 소켓 구독 및 데이터 처리
  useEffect(() => {
    if (!classId) return;

    const setupSubscriptions = () => {
      console.log(`✅ [Digital] 구독 시작 (ClassId: ${classId})`);
      
      const modeSub = stompClient.subscribe(SOCKET_CONFIG.SUBSCRIBE.MODE_STATUS(classId), (msg) => {
        const body = JSON.parse(msg.body);
        if (body.mode === 'NORMAL') {
          if (OverlayModule) OverlayModule.hideOverlay();
          router.replace('/screens/Classtime_Normal'); 
        }
      });

      const classSub = stompClient.subscribe(SOCKET_CONFIG.SUBSCRIBE.CLASS_TOPIC(classId), (msg) => {
        const body = JSON.parse(msg.body);
        
        if (body.type === 'CLASS_FINISHED' || body.type === 'END') {
          handleClassEndByTeacher();
        } 
        else if (['FOCUS', 'UNFOCUS', 'AWAY', 'SLEEPING'].includes(body.type)) {
          setStudentStatus(body.type);
        }
        // 🚀 실시간 테마 변경 수신 (선생님이 바꿀 때)
        else if (body.type === 'THEME_CHANGED') {
          const newChar = charMap[String(body.characterId)] || "char_1";
          const newBg = bgMap[String(body.backgroundId)] || "background1";
          
          setTheme({ character: newChar, background: newBg });

          // 오버레이 즉시 갱신
          if (OverlayModule && (appState.current.match(/inactive|background/) || inPipMode)) {
            OverlayModule.showOverlay("테마가 변경되었습니다!", false, newChar, newBg, 0, 0);
          }
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

  const handleClassEndByTeacher = () => {
    if (OverlayModule) OverlayModule.hideOverlay();
    if (Platform.OS === 'android') OverlayModule.relaunchApp();
    setIsResultVisible(true);
  };

  // 3. 앱 상태 변경 시 오버레이 제어
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current === "active" && nextAppState.match(/inactive|background/)) {
        if (Platform.OS === 'android' && !inPipMode && !isResultVisible) {
          // 🚀 현재 theme 상태를 사용하여 네이티브 오버레이 호출
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

  return (
    <View style={styles.container}>
      {permission?.granted && isCameraReady && (
        <View style={styles.hiddenCamera}>
          <CameraView style={{ flex: 1 }} facing="front" active={!isResultVisible} />
        </View>
      )}
      <View style={styles.content}>
        <TrafficLight size={inPipMode ? "small" : "large"} status={studentStatus} />
      </View>
      <ClassResultModal 
        visible={isResultVisible} 
        onClose={() => router.replace('/screens/Student_Home')}
        gainedXP={100} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  hiddenCamera: { position: "absolute", width: 1, height: 1, opacity: 0, zIndex: -1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});