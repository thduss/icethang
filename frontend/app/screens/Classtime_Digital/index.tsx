import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, AppState, Platform, NativeModules } from "react-native";
import { Camera, CameraType } from "expo-camera/legacy"; 
import * as FaceDetector from "expo-face-detector";
import PipHandler, { usePipModeListener } from 'react-native-pip-android';
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";

// 분리한 AI 헬퍼 함수 가져오기
import { calculateStudentStatus, calculateClassResult, StudentStatus } from "../../utils/aiHelper";

// UI 컴포넌트 및 소켓
import TrafficLight from "../../components/TrafficLight";
import ClassResultModal from "../../components/ClassResultModal";
import LevelUpRewardModal from "../../components/LevelUpRewardModal";
import { stompClient } from "../../utils/socket";
import { SOCKET_CONFIG } from "../../api/socket";
import { RootState } from "../../store/stores";

const { OverlayModule } = NativeModules;

export default function DigitalClassScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const studentData = useSelector((state: RootState) => state.auth.studentData);
  
  const inPipMode = usePipModeListener();
  const appState = useRef(AppState.currentState);
  
  // 상태 관리
  const [studentStatus, setStudentStatus] = useState<StudentStatus>("FOCUS");
  const lastStatus = useRef<StudentStatus>("FOCUS");
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [isLevelUpVisible, setIsLevelUpVisible] = useState(false);
  const [classStats, setClassStats] = useState({ score: 0, xp: 0 });

  // 누적 데이터 (경험치 계산용)
  const lessonClock = useRef({ focusTime: 0, totalTime: 0 });

  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
    const timer = setTimeout(() => setIsCameraReady(true), 1500);
    return () => clearTimeout(timer);
  }, [permission]);

  // 🚀 1. AI 분석 로직 (받아 쓰기)
  const handleFacesDetected = ({ faces }: { faces: any[] }) => {
    if (isResultVisible) return;

    // 헬퍼 함수를 통해 현재 상태 계산
    const currentStatus = calculateStudentStatus(faces[0]);
    
    // 경험치 정산을 위한 초 단위 기록 누적
    lessonClock.current.totalTime += 1;
    if (currentStatus === "FOCUS") {
      lessonClock.current.focusTime += 1;
    }

    updateStatus(currentStatus);
  };

  const updateStatus = (newStatus: StudentStatus) => {
    if (newStatus !== lastStatus.current) {
      setStudentStatus(newStatus);
      lastStatus.current = newStatus;

      // 선생님께 실시간 상태 전송
      if (stompClient.connected && classId) {
        stompClient.publish({
          destination: `/topic/class/${classId}`,
          body: JSON.stringify({
            type: newStatus,
            studentId: studentData?.studentId,
            studentName: studentData?.studentName,
          }),
        });
      }
    }
  };

  // 2. 소켓 이벤트 및 수업 종료 제어
  useEffect(() => {
    if (!classId) return;
    const onMessage = (msg: any) => {
      const body = JSON.parse(msg.body);
      if (body.mode === 'NORMAL') {
        if (OverlayModule) OverlayModule.hideOverlay();
        router.replace({ pathname: '/screens/Classtime_Normal', params: { classId } });
      }
      if (body.type === 'END' || body.type === 'CLASS_FINISHED') {
        handleClassEnd();
      }
    };
    const modeSub = stompClient.subscribe(SOCKET_CONFIG.SUBSCRIBE.MODE_STATUS(classId), onMessage);
    const classSub = stompClient.subscribe(SOCKET_CONFIG.SUBSCRIBE.CLASS_TOPIC(classId), onMessage);
    return () => { modeSub.unsubscribe(); classSub.unsubscribe(); };
  }, [classId]);

  const handleClassEnd = () => {
    if (OverlayModule) OverlayModule.hideOverlay();
    if (Platform.OS === 'android') OverlayModule.relaunchApp();

    // 🚀 3. 최종 경험치 및 점수 계산 (헬퍼 사용)
    const result = calculateClassResult(lessonClock.current.focusTime, lessonClock.current.totalTime);
    setClassStats(result);
    setIsResultVisible(true);
  };

  const handleCloseResult = () => {
    setIsResultVisible(false);
    // 레벨업 조건 체크 후 모달 띄우기
    setTimeout(() => setIsLevelUpVisible(true), 500);
  };

  // 4. 앱 상태 및 오버레이 관리 (PiP)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appState.current === "active" && nextState.match(/inactive|background/)) {
        if (Platform.OS === 'android' && !inPipMode && !isResultVisible) {
          OverlayModule?.showOverlay("집중도를 유지하세요!", false, "char_1", "city", 0, 1800);
          PipHandler.enterPipMode(500, 500);
        }
      } else if (nextState === "active") {
        OverlayModule?.hideOverlay();
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [inPipMode, isResultVisible]);

  return (
    <View style={styles.container}>
      {permission?.granted && isCameraReady && (
        <View style={styles.hiddenCamera}>
          <Camera 
            style={{ flex: 1 }} 
            type={CameraType.front}
            onFacesDetected={handleFacesDetected as any}
            faceDetectorSettings={{
              mode: FaceDetector.FaceDetectorMode.fast,
              detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
              runClassifications: FaceDetector.FaceDetectorClassifications.none,
              minDetectionInterval: 1000,
              tracking: true,
            }}
          />
        </View>
      )}
      
      <View style={styles.content}>
        <TrafficLight size={inPipMode ? "small" : "large"} status={studentStatus} />
      </View>

      <ClassResultModal 
        visible={isResultVisible} 
        onClose={handleCloseResult} 
        gainedXP={classStats.xp} // 👈 계산된 경험치 반영
      />
      <LevelUpRewardModal 
        visible={isLevelUpVisible} 
        onClose={() => router.replace('/screens/Student_Home')} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  hiddenCamera: { position: "absolute", width: 1, height: 1, opacity: 0, zIndex: -1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});