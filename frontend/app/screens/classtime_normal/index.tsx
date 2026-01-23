// 일반 수업시간 화면
import React, { useEffect } from "react"; 
import { Text, View, Alert, Linking, TouchableOpacity, StyleSheet } from "react-native"; 
import { CameraView, useCameraPermissions } from "expo-camera";
import ClassProgressBar from '../../components/classprogressbar/'
import AlertButton from "../../components/alertbutton";
import TraggicLight from "../../components/trafficlight";

export default function NormalClassScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  const checkPermissions = async () => {
    if (!permission) return;

    // 권한이 거부되었고, 다시 물어볼 수 없는 상태일 때 설정창
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
        // 그 외의 경우 권한 요청
        requestPermission();
      }
    }
  };

  // permission 상태가 바뀔 때마다 체크 (초기 실행 포함)
  useEffect(() => {
    checkPermissions();
  }, [permission?.status]); 

  // 권한 로딩 중일 때
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  // 권한이 부여되지 않았을 때 보여줄 화면
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

  // 권한이 부여되었을 때 카메라 화면 표시
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