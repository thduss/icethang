import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, AppState, Platform, NativeModules } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import PipHandler, { usePipModeListener } from 'react-native-pip-android';
import { useRouter, useLocalSearchParams } from "expo-router";

import TrafficLight from "../../components/TrafficLight";
import ClassResultModal from "../../components/ClassResultModal";

import { stompClient } from "../../utils/socket";
import { SOCKET_CONFIG } from "../../api/socket";

const { OverlayModule } = NativeModules;

export default function DigitalClassScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>(); 
  const inPipMode = usePipModeListener();
  const appState = useRef(AppState.currentState);
  
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [studentStatus, setStudentStatus] = useState<string>("FOCUS");
  // 🚀 최적화: 화면 진입 후 1초 뒤에 카메라를 켭니다 (렉 방지)
  const [isCameraReady, setIsCameraReady] = useState(false);

  // 1. 카메라 권한 및 지연 로딩
  useEffect(() => {
    if (!permission?.granted) requestPermission();
    const timer = setTimeout(() => setIsCameraReady(true), 1000);
    return () => clearTimeout(timer);
  }, [permission]);

  // 2. 소켓 구독 로직 (단순화 및 메모리 누수 방지)
  useEffect(() => {
    if (!classId) return;

    const setupSubscriptions = () => {
      console.log(`✅ [Digital] 구독 시작`);
      
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
        } else if (['FOCUS', 'UNFOCUS', 'AWAY', 'SLEEPING'].includes(body.type)) {
          setStudentStatus(body.type);
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
  }, [classId]); // stompClient.connected 의존성 제거 (무한 리렌더링 방지)

  const handleClassEndByTeacher = () => {
    if (OverlayModule) OverlayModule.hideOverlay();
    if (Platform.OS === 'android') OverlayModule.relaunchApp();
    setIsResultVisible(true);
  };

  // 3. 앱 상태 변경 (오버레이) 로직 최적화
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current === "active" && nextAppState.match(/inactive|background/)) {
        if (Platform.OS === 'android' && !inPipMode && !isResultVisible) {
          OverlayModule?.showOverlay("수업에 집중하고 있어요!", false, "char_1", "city", 0, 0);
          PipHandler.enterPipMode(500, 500);
        }
      } else if (nextAppState === "active") {
        OverlayModule?.hideOverlay();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [inPipMode, isResultVisible]);

  return (
    <View style={styles.container}>
      {/* 🚀 최적화: 카메라를 1x1 크기로 숨기고 지연 로딩 적용 */}
      {permission?.granted && isCameraReady && (
        <View style={styles.hiddenCamera}>
          <CameraView style={{ flex: 1 }} facing="front" active={!isResultVisible} />
        </View>
      )}
      
      <View style={styles.content}>
        <TrafficLight 
          size={inPipMode ? "small" : "large"} 
          status={studentStatus} 
        />
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