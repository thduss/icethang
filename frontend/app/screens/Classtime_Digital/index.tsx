import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, AppState, Platform, NativeModules } from "react-native";
import { CameraView } from "expo-camera";
import PipHandler, { usePipModeListener } from 'react-native-pip-android';
import TrafficLight from "../../components/TrafficLight";

const { OverlayModule } = NativeModules;

export default function DigitalClassScreen() {
  const inPipMode = usePipModeListener();
  const appState = useRef(AppState.currentState);
  
  // 수업 진행률 (앱 내 UI 표시용)
  const [progress, setProgress] = useState(0);

  // 앱 내부 UI용 타이머 (오버레이와 별개로 동작)
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current === "active" && nextAppState.match(/inactive|background/)) {
        if (Platform.OS === 'android' && !inPipMode) {
          PipHandler.enterPipMode(300, 300);
          
          // 🚀 현재 진행률(progress)을 넘겨주며 오버레이 호출
          // 이제 코틀린이 이 값부터 스스로 타이머를 돌립니다.
          OverlayModule.showOverlay(
            "수업 진행 중", 
            false, 
            "char_student_basic", 
            "bg_class_normal",
            progress
          );
        }
      } else if (nextAppState === "active") {
        OverlayModule.hideOverlay();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      OverlayModule.hideOverlay();
    };
  }, [inPipMode, progress]);

  return (
    <View style={styles.container}>
      <View style={styles.hiddenCamera}><CameraView style={{ flex: 1 }} /></View>
      <View style={styles.content}>
        <TrafficLight size={inPipMode ? "small" : "large"} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  hiddenCamera: { position: "absolute", width: 1, height: 1, opacity: 0 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});