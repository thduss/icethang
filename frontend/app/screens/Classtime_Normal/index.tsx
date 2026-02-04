import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, AppState, Platform, NativeModules, ActivityIndicator, TouchableOpacity, Text } from "react-native";
// 🚀 [변경] Vision Camera & TFLite 라이브러리
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useSharedValue } from 'react-native-worklets-core';
import { runOnJS } from 'react-native-reanimated';

// import PipHandler, { usePipModeListener } from 'react-native-pip-android';
import { useRouter } from "expo-router";

import TrafficLight from "../../components/TrafficLight";
import ClassResultModal from "../../components/ClassResultModal";

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { SOCKET_CONFIG } from "../../api/socket";
import { useSelector } from "react-redux";
import { RootState } from "../../store/stores";

const { OverlayModule } = NativeModules;

// AI 상태 타입 정의
type AIStatus = "FOCUS" | "UNFOCUS" | "AWAY" | "SLEEPING";

// 🧠 [설정] AI 임계값 (조절 가능)
const YAW_THRESHOLD = 0.25; // 고개 돌림 기준 (0.5가 정면, 차이 0.25 이상이면 이탈)
const EAR_THRESHOLD = 0.08; // 눈 떠짐 기준 (이보다 작으면 감은 것)
const MOVEMENT_THRESHOLD = 20; // 움직임 산만 기준

// 📍 [설정] Face Mesh 랜드마크 인덱스
const IDX = {
  // 왼쪽 눈 (위, 아래, 왼쪽, 오른쪽)
  LEFT_EYE: [159, 145, 33, 133], 
  // 오른쪽 눈 (위, 아래, 왼쪽, 오른쪽)
  RIGHT_EYE: [386, 374, 362, 263],
  // 얼굴 윤곽 (왼쪽 귀, 오른쪽 귀) -> 고개 각도 계산용
  FACE_EDGES: [234, 454], 
  // 코 끝
  NOSE_TIP: 1 
};

export default function DigitalClassScreen() {
  const router = useRouter();
  // const inPipMode = usePipModeListener();
  const appState = useRef(AppState.currentState);
  
  // Redux 정보
  const { studentData } = useSelector((state: RootState) => state.auth);
  const classId = studentData?.classId?.toString() || "1";

  // 🚀 [변경] Vision Camera 설정
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const model = useTensorflowModel({ url: 'file:///android_asset/face_landmarker.tflite' });
  const { resize } = useResizePlugin();

  const [isResultVisible, setIsResultVisible] = useState(false);
  const [studentStatus, setStudentStatus] = useState<AIStatus>("FOCUS");
  const [isConnected, setIsConnected] = useState(false);

  // 🤖 AI SharedValues (Worklet용)
  const faceMissingCount = useSharedValue(0);
  const lastNoseX = useSharedValue(0);
  const lastNoseY = useSharedValue(0);
  const movementScore = useSharedValue(0);
  
  // JS 스레드용 Refs
  const stompClient = useRef<Client | null>(null);
  const lastAlertTime = useRef(0);
  const gazeFailCount = useRef(0); // 시선/졸음 누적 카운트 (JS측)

  // 권한 요청
  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  // ============================================================
  // 🤖 1. 온디바이스 AI 로직 (Vision Camera Frame Processor)
  // ============================================================
  
  // JS 스레드로 상태 업데이트 전달
  const updateAiStatusJS = (newStatus: AIStatus) => {
    setStudentStatus(prev => {
      // 상태 변경 시 서버 전송 로직 호출을 위해 상태값 변경
      if (prev !== newStatus) return newStatus;
      return prev;
    });
  };

  // 🧮 거리 계산 헬퍼 (Worklet)
  const getDistance = (p1: number[], p2: number[]) => {
    'worklet';
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
  };

  // 🧮 EAR(눈 떠짐) 계산 헬퍼 (Worklet)
  const calculateEAR = (landmarks: Float32Array, indices: number[]) => {
    'worklet';
    const getPoint = (idx: number) => [landmarks[idx * 3], landmarks[idx * 3 + 1]];
    const vDist = getDistance(getPoint(indices[0]), getPoint(indices[1])); // 상하
    const hDist = getDistance(getPoint(indices[2]), getPoint(indices[3])); // 좌우
    return vDist / hDist;
  };

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (model.state !== 'loaded') return;

    // 1. 전처리 (192x192 RGB)
    const resized = resize(frame, {
      scale: { width: 192, height: 192 },
      pixelFormat: 'rgb',
      dataType: 'float32',
    });

    // 2. 모델 실행
    const outputs = model.model.runSync([resized]);
    const landmarks = outputs[0] as Float32Array;

    // [CASE 1] 얼굴 없음 (AWAY)
    // 코 끝 좌표가 거의 0이면 얼굴 없음으로 간주 (모델 특성에 따라 다를 수 있음)
    // 또는 landmarks 배열 값이 모두 0인지 체크. 여기서는 코 좌표 유효성으로 체크.
    const noseX = landmarks[IDX.NOSE_TIP * 3];
    const noseY = landmarks[IDX.NOSE_TIP * 3 + 1];

    if (Math.abs(noseX) < 0.01 && Math.abs(noseY) < 0.01) {
      faceMissingCount.value += 1;
      if (faceMissingCount.value > 150) { // 약 5초 (30FPS 기준)
        runOnJS(updateAiStatusJS)("AWAY");
      }
      return;
    }
    faceMissingCount.value = 0;

    // [CASE 2] 졸음 감지 (EAR)
    const leftEAR = calculateEAR(landmarks, IDX.LEFT_EYE);
    const rightEAR = calculateEAR(landmarks, IDX.RIGHT_EYE);
    const avgEAR = (leftEAR + rightEAR) / 2;
    const isSleeping = avgEAR < EAR_THRESHOLD;

    // [CASE 3] 시선 이탈 (Yaw Ratio)
    // 얼굴 왼쪽끝~오른쪽끝 사이에서 코가 어디에 있는지 비율 계산
    const leftEdgeX = landmarks[IDX.FACE_EDGES[0] * 3];
    const rightEdgeX = landmarks[IDX.FACE_EDGES[1] * 3];
    const faceWidth = Math.abs(rightEdgeX - leftEdgeX);
    
    // 코가 정중앙(0.5)에서 얼마나 벗어났는가
    const yawRatio = (noseX - leftEdgeX) / faceWidth;
    const isLookingAway = Math.abs(yawRatio - 0.5) > YAW_THRESHOLD;

    // [CASE 4] 움직임 (산만함)
    const diff = Math.abs(noseX - lastNoseX.value) + Math.abs(noseY - lastNoseY.value);
    lastNoseX.value = noseX;
    lastNoseY.value = noseY;

    if (diff > 2.0) movementScore.value += 1;
    else movementScore.value = Math.max(0, movementScore.value - 0.5);
    const isMovingTooMuch = movementScore.value > MOVEMENT_THRESHOLD;

    // [종합 판정] 우선순위: 이탈 > 졸음 > 시선 > 산만
    if (isLookingAway) {
      runOnJS(updateAiStatusJS)("UNFOCUS"); // 시선 이탈
    } else if (isSleeping) {
      runOnJS(updateAiStatusJS)("UNFOCUS"); // 졸음 (상태값 통일)
    } else if (isMovingTooMuch) {
      runOnJS(updateAiStatusJS)("UNFOCUS"); // 움직임
    } else {
      runOnJS(updateAiStatusJS)("FOCUS");
    }

  }, [model]);

  // ============================================================
  // 🔌 2. 상태 처리 및 소켓 전송 (JS 스레드)
  // ============================================================
  useEffect(() => {
    // 상태 변경 시 서버 전송 & 오버레이 알림
    const now = Date.now();
    
    // FOCUS가 아니면 전송 (쿨타임 3초)
    if (studentStatus !== "FOCUS" && (now - lastAlertTime.current > 3000)) {
      sendAlertToServer(studentStatus);
      lastAlertTime.current = now;

      // 안드로이드 PiP 오버레이 알림
      // if (inPipMode && Platform.OS === 'android') {
      //   OverlayModule?.showOverlay("바른 자세로 집중해주세요!", false, "char_bad", "warning", 0, 0);
      // }
    } else if (studentStatus === "FOCUS") {
      // (선택) 집중 상태로 돌아오면 오버레이 끄기? -> 필요 시 구현
    }
  }, [studentStatus]);

  const sendAlertToServer = (type: AIStatus) => {
    if (stompClient.current && stompClient.current.connected && studentData) {
      const payload = {
        classid: parseInt(classId),
        studentld: studentData.studentId,
        studentName: studentData.studentName,
        type: type === "SLEEPING" ? "UNFOCUS" : type, // 서버 스펙 통일
        detectedAt: new Date().toISOString()
      };
      
      stompClient.current.publish({ 
        destination: "/app/alert", 
        body: JSON.stringify(payload) 
      });
      console.log(`📡 [Digital Alert] ${type}`);
    }
  };

  // ============================================================
  // 🔌 3. 소켓 연결 및 앱 상태 관리
  // ============================================================
  useEffect(() => {
    if (!studentData) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(SOCKET_CONFIG.BROKER_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("✅ [Digital] VisionCam 소켓 연결 성공");
        setIsConnected(true);

        const enterPayload = {
          classid: parseInt(classId),
          studentld: studentData.studentId,
          studentName: studentData.studentName
        };
        client.publish({ destination: "/app/enter", body: JSON.stringify(enterPayload) });

        client.subscribe(`/topic/class/${classId}/mode`, (msg) => {
          const body = JSON.parse(msg.body);
          if (body.mode === 'NORMAL') {
            if (OverlayModule) OverlayModule.hideOverlay();
            router.replace('/Classtime_Normal');
          }
        });

        client.subscribe(`/topic/class/${classId}`, (msg) => {
          const body = JSON.parse(msg.body);
          if (body.type === 'CLASS_FINISHED' || body.type === 'END') {
            handleClassEndByTeacher();
          }
        });
      },
      onStompError: (frame) => console.error("❌ 소켓 에러:", frame.headers['message']),
    });

    client.activate();
    stompClient.current = client;

    return () => {
      if (stompClient.current) stompClient.current.deactivate();
    };
  }, [studentData]);

  const handleClassEndByTeacher = () => {
    if (OverlayModule) OverlayModule.hideOverlay();
    if (Platform.OS === 'android') OverlayModule.relaunchApp();
    setIsResultVisible(true);
  };

  // PiP 및 오버레이 관리
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current === "active" && nextAppState.match(/inactive|background/)) {
        if (Platform.OS === 'android' && !isResultVisible) {
          OverlayModule?.showOverlay("수업에 집중하고 있어요!", false, "char_1", "city", 0, 0);
          // PipHandler.enterPipMode(500, 500);
        }
      } else if (nextAppState === "active") {
        OverlayModule?.hideOverlay();
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [isResultVisible]);

  // UI 렌더링
  if (!hasPermission) return <View style={styles.container} />;
  if (device == null) return <ActivityIndicator size="large" color="white" />;

  return (
    <View style={styles.container}>
      {/* 🚀 [중요] 카메라는 1x1 픽셀로 존재해야 프레임 프로세서가 돕니다 */}
      {/* active={!isResultVisible} : 결과창 뜨면 카메라 중지 */}
      <View style={styles.hiddenCamera}>
        <Camera 
          style={{ flex: 1 }} 
          device={device}
          isActive={!isResultVisible}
          frameProcessor={frameProcessor} // ✨ AI 연결
          pixelFormat="yuv"
        />
      </View>
      
      {/* <View style={styles.content}>
        <TrafficLight 
          size={inPipMode ? "small" : "large"} 
          status={studentStatus === "SLEEPING" ? "UNFOCUS" : studentStatus} 
        />
      </View> */}

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
  // Vision Camera가 작동하려면 뷰가 렌더링되어 있어야 하므로 1x1로 유지
  hiddenCamera: { position: "absolute", width: 1, height: 1, opacity: 0, zIndex: -1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});