import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, AppState, Platform, NativeModules } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import PipHandler, { usePipModeListener } from 'react-native-pip-android';
import { Client } from "@stomp/stompjs";
import TrafficLight from "../../components/TrafficLight";
import ClassResultModal from "../../components/ClassResultModal";
import { useRouter, useLocalSearchParams } from "expo-router";

// 네이티브 모듈 및 소켓 설정
const { OverlayModule } = NativeModules;
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const SOCKET_URL = BASE_URL?.replace('http', 'ws') + '/ws';

const SOCKET_CONFIG = {
  BROKER_URL: SOCKET_URL,
  RECONNECT_DELAY: 5000,
  HEARTBEAT: 4000,
  SUBSCRIBE: {
    MODE_STATUS: (classId: string) => `/topic/class/${classId}/mode`,
    CLASS_TOPIC: (classId: string) => `/topic/class/${classId}`,
  },
};

export default function DigitalClassScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>(); 
  const inPipMode = usePipModeListener();
  const appState = useRef(AppState.currentState);
  const stompClient = useRef<Client | null>(null);
  
  // 상태 관리
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  // 🚀 TrafficLight에 전달할 상태 추가 (초기값: 집중)
  const [studentStatus, setStudentStatus] = useState<string>("FOCUS");

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  /**
   * 실시간 소켓 통신 설정
   */
  useEffect(() => {
    if (!classId) return;

    const client = new Client({
      brokerURL: SOCKET_CONFIG.BROKER_URL,
      reconnectDelay: SOCKET_CONFIG.RECONNECT_DELAY,
      heartbeatIncoming: SOCKET_CONFIG.HEARTBEAT,
      heartbeatOutgoing: SOCKET_CONFIG.HEARTBEAT,
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      
      onConnect: () => {
        console.log("✅ [SOCKET] 연결 성공");

        // 1. 수업 모드 전환 감지 (NORMAL 전환 시 일반 수업 화면으로 이동)
        client.subscribe(SOCKET_CONFIG.SUBSCRIBE.MODE_STATUS(classId), (message) => {
          const payload = JSON.parse(message.body);
          if (payload.mode === 'NORMAL') {
            if (OverlayModule) OverlayModule.hideOverlay();
            router.replace('/screens/Classtime_Normal'); 
          }
        });

        // 2. 수업 종료 신호 감지
        client.subscribe(SOCKET_CONFIG.SUBSCRIBE.CLASS_TOPIC(classId), (message) => {
          const payload = JSON.parse(message.body);
          if (payload.type === "CLASS_FINISHED" || payload.type === "END") {
            handleClassEndByTeacher();
          }
          // 🚀 추가: 만약 이 채널로 집중도 상태가 온다면 신호등 업데이트
          if (payload.type === "UNFOCUS" || payload.type === "AWAY" || payload.type === "FOCUS") {
            setStudentStatus(payload.type);
          }
        });
      },
    });

    client.activate();
    stompClient.current = client;

    return () => {
      if (stompClient.current) stompClient.current.deactivate();
      if (OverlayModule) OverlayModule.hideOverlay();
    };
  }, [classId]);

  const handleClassEndByTeacher = () => {
    if (OverlayModule) OverlayModule.hideOverlay();
    if (Platform.OS === 'android') OverlayModule.relaunchApp();

    setTimeout(() => {
      setIsResultVisible(true);
    }, 800);
  };

  /**
   * 백그라운드 전환 시 기차 오버레이 제어
   */
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current === "active" && nextAppState.match(/inactive|background/)) {
        if (Platform.OS === 'android' && !inPipMode && !isResultVisible) {
          if (OverlayModule) {
            OverlayModule.showOverlay("수업에 집중하고 있어요!", false, "char_1", "city", 0, 0);
          }
          PipHandler.enterPipMode(500, 500);
        }
      } else if (nextAppState === "active") {
        if (OverlayModule) OverlayModule.hideOverlay();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [inPipMode, isResultVisible]);

  return (
    <View style={styles.container}>
      {permission?.granted && (
        <View style={styles.hiddenCamera}>
          <CameraView style={{ flex: 1 }} facing="front" active={!isResultVisible} />
        </View>
      )}
      
      <View style={styles.content}>
        {/* 🚀 에러 수정: status 속성 추가 */}
        <TrafficLight 
          size={inPipMode ? "small" : "large"} 
          status={studentStatus} 
        />
      </View>

      <ClassResultModal 
        visible={isResultVisible} 
        onClose={() => {
          setIsResultVisible(false);
          router.replace('/screens/Student_Home');
        }}
        gainedXP={100} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  hiddenCamera: { position: "absolute", width: 1, height: 1, opacity: 0.01, zIndex: -1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});