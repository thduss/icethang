import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, AppState, Platform, NativeModules, Text } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import PipHandler, { usePipModeListener } from 'react-native-pip-android';
import { Client } from "@stomp/stompjs";
import TrafficLight from "../../components/TrafficLight";
import ClassResultModal from "../../components/ClassResultModal";
import { useRouter, useLocalSearchParams } from "expo-router";

const { OverlayModule } = NativeModules;

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const SOCKET_URL = BASE_URL?.replace('http', 'ws') + '/ws';

const SOCKET_CONFIG = {
  BROKER_URL: SOCKET_URL,
  PUBLISH: {
    CLASS_TOPIC: (classId: string) => `/topic/class/${classId}`,
  },
  SUBSCRIBE: {
    ALERT: "/app/alert",
    MODE_STATUS: (classId: string) => `/topic/class/${classId}/mode`,
    STUDENT_COUNT: (classId: string) => `/topic/class/${classId}/count`,
  },
  RECONNECT_DELAY: 5000,
  HEARTBEAT: 4000,
};

export default function DigitalClassScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>(); 
  const inPipMode = usePipModeListener();
  const appState = useRef(AppState.currentState);
  const stompClient = useRef<Client | null>(null);
  
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  //  소켓 연결 및 종료 신호 수신
  useEffect(() => {
    if (!classId) return;

    const client = new Client({
      brokerURL: SOCKET_CONFIG.BROKER_URL,
      reconnectDelay: SOCKET_CONFIG.RECONNECT_DELAY,
      heartbeatIncoming: SOCKET_CONFIG.HEARTBEAT,
      heartbeatOutgoing: SOCKET_CONFIG.HEARTBEAT,
      // React Native 호환성 설정
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      
      onConnect: () => {
        console.log("✅ [SOCKET] 연결 성공");
        client.subscribe(SOCKET_CONFIG.SUBSCRIBE.MODE_STATUS(classId), (message) => {
          const payload = JSON.parse(message.body);
          console.log("📩 [SOCKET] 모드 변경:", payload);

          if (payload.status === "END" || payload.type === "FINISHED") {
            handleClassEndByTeacher();
          }
        });
      },
      onStompError: (frame) => {
        console.error("❌ [SOCKET] 에러:", frame.headers['message']);
      },
    });

    client.activate();
    stompClient.current = client;

    return () => {
      if (stompClient.current) stompClient.current.deactivate();
    };
  }, [classId]);

  const handleClassEndByTeacher = () => {
    if (OverlayModule) OverlayModule.hideOverlay();
    if (Platform.OS === 'android') OverlayModule.relaunchApp();

    setTimeout(() => {
      setIsResultVisible(true);
    }, 800);
  };

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
      if (OverlayModule) OverlayModule.hideOverlay();
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
        <TrafficLight size={inPipMode ? "small" : "large"} />
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
  hiddenCamera: { position: "absolute", width: 10, height: 10, opacity: 0.02, zIndex: -1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});