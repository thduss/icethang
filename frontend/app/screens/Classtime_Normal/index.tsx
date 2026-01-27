// 일반 수업시간 화면
import React, { useEffect } from "react"; 
import { Text, View, Alert, Linking, TouchableOpacity, StyleSheet } from "react-native"; 
import { CameraView, useCameraPermissions } from "expo-camera";
import ClassProgressBar from '../../components/ClassProgressBar'
import AlertButton from "../../components/AlertButton";
import TraggicLight from "../../components/TrafficLight";

export default function NormalClassScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  const checkPermissions = async () => {
    if (!permission) return;
    if (permission.status !== "granted") {
      if (!permission.canAskAgain) {
        Alert.alert(
          "권한 필요",
          "앱 설정에서 카메라 권한을 변경해주세요.",
          [
            { text: "취소", style: "cancel" },
            {
              text: "설정 열기",
              onPress: () => Linking.openSettings(),
            },
          ],
          { cancelable: false }
        );
      } else {
        requestPermission();
      }
    }
  };

  useEffect(() => {
    checkPermissions();
  }, [permission?.status]); 

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  if (permission.status !== "granted") {
    return (
      <View style={styles.permissionContainer}>
        <Text style={{ fontSize: 16 }}>카메라 권한이 필요합니다.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>권한 요청</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" />
       <ClassProgressBar targetMinutes={1} />
       <TraggicLight />
        <AlertButton />
    </View>
  );
}

// 스타일 정의 추가
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#007AFF",
    borderRadius: 10,
  },
  permissionButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});