import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, AppState, Platform, NativeModules } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import PipHandler, { usePipModeListener } from 'react-native-pip-android';
import TrafficLight from "../../components/TrafficLight";

const { OverlayModule } = NativeModules;

export default function DigitalClassScreen() {
  const inPipMode = usePipModeListener();
  const appState = useRef(AppState.currentState);
  const [isAlert, setIsAlert] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current === "active" && nextAppState.match(/inactive|background/)) {
        if (Platform.OS === 'android' && !inPipMode) {
          PipHandler.enterPipMode(300, 300);
          
          OverlayModule.showOverlay(
            isAlert ? "⚠️ 수업 이탈 감지!" : "✅ 정상 수업 참여 중", 
            isAlert
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
  }, [inPipMode, isAlert]);

  return (
    <View style={styles.container}>
      <View style={styles.hiddenCamera}><CameraView style={{ flex: 1 }} /></View>
      {inPipMode ? (
        <View style={styles.pipContent}><TrafficLight size="small" /></View>
      ) : (
        <View style={styles.normalUI}><TrafficLight size="large" /></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  hiddenCamera: { position: "absolute", width: 1, height: 1, opacity: 0 },
  pipContent: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  normalUI: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});