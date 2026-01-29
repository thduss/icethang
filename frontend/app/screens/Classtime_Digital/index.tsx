import React, { useEffect, useState } from "react"
import { View, StyleSheet, Text } from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import ClassProgressBar from "../../components/ClassProgressBar"
import TrafficLight from "../../components/TrafficLight"
import AlertButton from "../../components/AlertButton"
import CalibrationModal from "../../components/Calibration"

export default function DigitalClassScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [showCalibration, setShowCalibration] = useState(false)

  useEffect(() => {
    if (permission && permission.status !== "granted") {
      requestPermission()
    }
  }, [permission])

  useEffect(() => {
    if (permission?.status === "granted") {
      setShowCalibration(true)
    }
  }, [permission])

  if (!permission || permission.status !== "granted") {
    return (
      <View style={styles.container}>
        <Text style={styles.centerText}>권한 확인 중...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.hiddenCamera}>
        <CameraView style={{ flex: 1 }} facing="back" />
      </View>

      <ClassProgressBar targetMinutes={1} />
      <TrafficLight />
      <AlertButton />

      <CalibrationModal
        visible={showCalibration}
        onFinish={() => setShowCalibration(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  hiddenCamera: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  centerText: {
    color: "#fff",
    textAlign: "center",
    marginTop: "50%",
  },
})
// 저장