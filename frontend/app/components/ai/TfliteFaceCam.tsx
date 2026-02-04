import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useSharedValue } from 'react-native-worklets-core';
import { runOnJS } from 'react-native-reanimated';

// === [설정] ===
const YAW_THRESHOLD = 0.25; // 시선 이탈 기준 (비율)
const EAR_THRESHOLD = 0.08; // 졸음 기준 (EAR)
const MOVEMENT_THRESHOLD = 20; // 산만함 기준 점수

// 프레임 카운트 기준 (대략 30FPS 기준)
// TFLite는 빠르기 때문에 카운트를 넉넉하게 잡습니다.
const AWAY_FRAME_LIMIT = 100; // 약 3~5초간 얼굴 없으면 이탈

const IDX = {
  LEFT_EYE: [159, 145, 33, 133],
  RIGHT_EYE: [386, 374, 362, 263],
  FACE_EDGES: [234, 454],
  NOSE_TIP: 1
};

interface Props {
  ws: WebSocket | null;
  classId: number;
  studentId: number;
  studentName: string;
  mode: "DIGITAL" | "NORMAL";
}

export default function TfliteFaceCam({ ws, classId, studentId, studentName, mode }: Props) {
  const device = useCameraDevice('front');
  const [permission, setPermission] = useState(false);
  
  // 모델 로드
  const model = useTensorflowModel(require('../../../assets/face_landmarker.tflite'));
  const { resize } = useResizePlugin();

  const [status, setStatus] = useState("FOCUS");
  const lastAlertTime = useRef(0);
  
  // Worklet(UI스레드 밖)에서 쓸 값들은 useSharedValue 사용
  const faceMissingCount = useSharedValue(0);
  const lastNoseX = useSharedValue(0);
  const lastNoseY = useSharedValue(0);
  const movementScore = useSharedValue(0);
  
  // 연산 부하 조절용 (프레임 스킵)
  const frameCounter = useSharedValue(0);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setPermission(status === 'granted');
    })();
  }, []);

  // 📡 JS 스레드: 서버 전송
  const sendAlert = (type: string, msg: string) => {
    setStatus(type);
    const now = Date.now();
    // 3초 쿨타임
    if (type !== "FOCUS" && now - lastAlertTime.current > 3000) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type, 
          message: msg, 
          classid: classId, 
          studentId, 
          studentName, 
          alertTime: new Date().toISOString()
        }));
        lastAlertTime.current = now;
        console.log(`📡 TFLite Alert [${mode}]: ${type} - ${msg}`);
      }
    }
  };

  // 🧮 [Worklet] 거리 계산
  const getDistance = (p1: number[], p2: number[]) => {
    'worklet';
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
  };

  // 🧮 [Worklet] EAR 계산
  const calculateEAR = (landmarks: Float32Array, indices: number[]) => {
    'worklet';
    const getPoint = (idx: number) => [landmarks[idx * 3], landmarks[idx * 3 + 1]];
    return getDistance(getPoint(indices[0]), getPoint(indices[1])) / getDistance(getPoint(indices[2]), getPoint(indices[3]));
  };

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (model.state !== 'loaded') return;

    // 성능 최적화: 3프레임에 1번만 분석 (약 10~20 FPS 효과)
    frameCounter.value += 1;
    if (frameCounter.value % 3 !== 0) return;

    // 1. 이미지 전처리
    const resized = resize(frame, {
      scale: { width: 192, height: 192 },
      pixelFormat: 'rgb',
      dataType: 'float32',
    });

    // 2. 모델 실행
    const outputs = model.model.runSync([resized]);
    const landmarks = outputs[0] as Float32Array;

    // [CASE 1] 얼굴 없음 (자리 이탈 체크)
    if (landmarks.length < 100) {
      faceMissingCount.value += 1;
      if (faceMissingCount.value > AWAY_FRAME_LIMIT) { // 5초 이상
        runOnJS(sendAlert)("AWAY", "자리 이탈 감지 (5초)");
      }
      return;
    }
    
    // 얼굴 찾음 -> 이탈 카운트 초기화
    faceMissingCount.value = 0;


    // --- 공통 데이터 추출 ---
    const noseX = landmarks[IDX.NOSE_TIP * 3];
    const noseY = landmarks[IDX.NOSE_TIP * 3 + 1];

    // 움직임(Movement) 계산 (공통)
    const diff = Math.abs(noseX - lastNoseX.value) + Math.abs(noseY - lastNoseY.value);
    lastNoseX.value = noseX;
    lastNoseY.value = noseY;

    // 움직임 점수 누적
    // TFLite 좌표는 192 기준이므로 움직임 임계값을 작게(2~3) 잡음
    if (diff > 2) movementScore.value += 1;
    else movementScore.value = Math.max(0, movementScore.value - 0.5);
    
    const isMovingTooMuch = movementScore.value > MOVEMENT_THRESHOLD;


    // ---------------------------------------------
    // 🧠 3. 모드별 로직 분기
    // ---------------------------------------------
    
    if (mode === "DIGITAL") {
      // === [디지털 수업]: 시선 + 졸음 + 움직임 ===
      
      // (A) 졸음 (EAR)
      const leftEAR = calculateEAR(landmarks, IDX.LEFT_EYE);
      const rightEAR = calculateEAR(landmarks, IDX.RIGHT_EYE);
      const avgEAR = (leftEAR + rightEAR) / 2;
      const isSleeping = avgEAR < EAR_THRESHOLD;

      // (B) 시선 (Yaw Ratio)
      const leftEdgeX = landmarks[IDX.FACE_EDGES[0] * 3];
      const rightEdgeX = landmarks[IDX.FACE_EDGES[1] * 3];
      const faceWidth = Math.abs(rightEdgeX - leftEdgeX);
      const yawRatio = (noseX - leftEdgeX) / faceWidth;
      const isLookingAway = Math.abs(yawRatio - 0.5) > YAW_THRESHOLD;

      // (C) 종합 판정 (우선순위: 이탈 > 졸음 > 산만)
      if (isLookingAway) {
        runOnJS(sendAlert)("UNFOCUS", "시선 이탈");
      } else if (isSleeping) {
        runOnJS(sendAlert)("UNFOCUS", "졸음 감지");
      } else if (isMovingTooMuch) {
        runOnJS(sendAlert)("UNFOCUS", "주의 산만 (움직임)"); // ✨ 추가됨
      } else {
        runOnJS(setStatus)("FOCUS");
      }

    } else {
      // === [일반 수업]: 움직임(산만함) 집중 ===
      
      if (isMovingTooMuch) {
         runOnJS(sendAlert)("UNFOCUS", "주의 산만 (과도한 움직임)");
      } else {
         runOnJS(setStatus)("FOCUS");
      }
    }
  }, [model, mode]);

  if (!device || !permission) return <Text style={{color:'white'}}>AI 카메라 로딩중...</Text>;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
      />
      <View style={styles.overlay}>
        <Text style={{color: status==='FOCUS'?'lime':'red', fontSize:16, fontWeight:'bold'}}>
          [{mode}] {status}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', borderRadius: 20, overflow: 'hidden' },
  overlay: { position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 8 }
});