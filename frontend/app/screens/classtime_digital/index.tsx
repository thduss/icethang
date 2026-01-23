import React, { useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import ClassProgressBar from '../../components/classprogressbar/'
import TrafficLight from "../../components/trafficlight";
import AlertButton from "../../components/alertbutton";

export default function DigitalClassScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (permission && permission.status !== "granted") {
      requestPermission();
    }
  }, [permission]);

  // 권한 확인 중일 때의 처리
  if (!permission || permission.status !== "granted") {
    return (
      <View style={styles.container}>
        <Text style={styles.centerText}>권한 확인 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hiddenCamera}>
        <CameraView style={{ flex: 1 }} facing="back" />
      </View>
      <ClassProgressBar targetMinutes={1} />
      <TrafficLight />
      <AlertButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'transparent'
  },
  hiddenCamera: { 
    position: 'absolute', 
    width: 1, 
    height: 1, 
    opacity: 0 
  },
  centerText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: '50%'
  }
});