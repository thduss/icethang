import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { View, StyleSheet, AppState, NativeModules, ActivityIndicator, Text, Image } from "react-native";
import { Camera, useCameraDevice, useFrameProcessor } from "react-native-vision-camera";
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { Worklets } from 'react-native-worklets-core';
import PipHandler from 'react-native-pip-android';
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSelector } from "react-redux";
import axios from 'axios';

import ClassResultModal from "../../components/ClassResultModal";
import LevelUpRewardModal from "../../components/LevelUpRewardModal";
import { stompClient } from "../../utils/socket";
import { RootState } from "../../store/stores";

const { OverlayModule } = NativeModules;

const charMap: Record<string, string> = { 
  "5": "char_1", "6": "char_2", "7": "char_3", "8": "char_4", 
  "9": "char_5", "10": "char_6", "11": "char_7", "12": "char_8",
  "13": "char_9", "14": "char_10", "15": "char_11", "16": "char_12"
};
const bgMap: Record<string, string> = { "1": "background1", "2": "background2", "3": "background3", "4": "background4" };

const YAW_THRESHOLD = 0.22;
const EAR_THRESHOLD = 0.12;

export default function DigitalClassScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>(); 
  const [isReady, setIsReady] = useState(false);
  const isExiting = useRef(false);
  const appState = useRef(AppState.currentState);
  
  const authState = useSelector((state: RootState) => state.auth) as any;
  const themeState = useSelector((state: RootState) => state.theme) as any;
  const user = authState?.user;

  const [studentStatus, setStudentStatus] = useState<string>("FOCUS");
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [isLevelUpVisible, setIsLevelUpVisible] = useState(false);
  const [hasLevelUpData, setHasLevelUpData] = useState(false);
  const [resultData, setResultData] = useState({ focusRate: 0, currentXP: 0, maxXP: 100 });

  const currentTheme = useMemo(() => ({
    character: charMap[String(themeState?.equippedCharacterId)] || "char_1",
    background: bgMap[String(themeState?.equippedBackgroundId)] || "background1"
  }), [themeState]);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const fetchClassResult = async () => {
    try {
      const response = await axios.get(`/api/class/${classId}/result/${user?.id}`);
      const data = response.data;
      setResultData({ focusRate: data.focusRate || 0, currentXP: data.currentXP || 0, maxXP: data.maxXP || 100 });
      setHasLevelUpData(!!data.levelUp);
      setIsResultVisible(true);
    } catch (error) {
      console.error("❌ 결과 조회 실패:", error);
      setIsResultVisible(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      isExiting.current = false;
      return () => {
        isExiting.current = true;
        OverlayModule?.hideOverlay();
      };
    }, [])
  );

  const setStatusJS = Worklets.createRunOnJS((newStatus: string, details: string) => {
    if (isExiting.current) return;
    if (studentStatus !== newStatus) {
      setStudentStatus(newStatus);
      if (stompClient?.connected) {
        const kst = new Date(new Date().getTime() + 32400000).toISOString().split('.')[0];
        stompClient.publish({
          destination: `/pub/class/${classId}/status`,
          body: JSON.stringify({ classId: Number(classId), studentId: user?.id, studentName: user?.name, type: newStatus, detectedAt: kst }),
        });
      }
      OverlayModule?.updateOverlayStatus(newStatus);
    }
  });

  const device = useCameraDevice('front');
  const model = useTensorflowModel(isReady ? require('../../../assets/face_landmarker.tflite') : null);
  const { resize } = useResizePlugin();

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (!isReady || model.state !== 'loaded' || isExiting.current) return;
    const resized = resize(frame, { scale: { width: 192, height: 192 }, pixelFormat: 'rgb', dataType: 'float32' });
    const outputs = model.model.runSync([resized]);

    if (outputs && outputs.length > 0) {
      const landmarks = outputs[0] as Float32Array;
      if (landmarks && landmarks.length > 100) {
        const noseX = landmarks[1 * 3];
        const leftEAR = (Math.abs(landmarks[159*3+1] - landmarks[145*3+1])) / (Math.abs(landmarks[33*3] - landmarks[133*3]));
        const faceWidth = Math.abs(landmarks[454*3] - landmarks[234*3]);
        const yawVal = Math.abs((noseX - landmarks[234*3]) / faceWidth - 0.5);

        let status = "FOCUS";
        if (yawVal > YAW_THRESHOLD) status = "UNFOCUS";
        else if (leftEAR < EAR_THRESHOLD) status = "SLEEPING";

        setStatusJS(status, `EAR: ${leftEAR.toFixed(2)}, Yaw: ${yawVal.toFixed(2)}`);
      } else {
        setStatusJS("AWAY", "얼굴 없음");
      }
    }
  }, [model, isReady]);

  const processClassFinished = (data: any) => {
    isExiting.current = true;
    try {
      OverlayModule?.hideOverlay();
      OverlayModule?.relaunchApp?.(); 
    } catch (e) {
      console.warn("⚠️ 네이티브 호출 실패:", e);
    }

    setResultData({
      focusRate: data.focusRate || 0,
      currentXP: data.currentXP || 0,
      maxXP: data.maxXP || 100
    });
    setHasLevelUpData(!!data.levelUp);

    setTimeout(() => {
      setIsResultVisible(true);
    }, 700);
  };

  useEffect(() => {
    if (!isReady || !classId || !stompClient.connected) return;
    const classSub = stompClient.subscribe(`/topic/class/${classId}`, (msg) => {
      const body = JSON.parse(msg.body);
      if (body.type === 'CLASS_FINISHED') {
        processClassFinished(body);
      }
    });
    return () => classSub.unsubscribe();
  }, [isReady, classId]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (isExiting.current || isResultVisible) {
        OverlayModule?.hideOverlay();
        return;
      }
      if (appState.current === "active" && nextState.match(/inactive|background/)) {
        OverlayModule?.showOverlay("집중도 측정 중", false, currentTheme.character, currentTheme.background, 0, 0);
        setTimeout(() => { if (!isExiting.current) PipHandler.enterPipMode(500, 500); }, 300);
      } else if (nextState === "active") {
        OverlayModule?.hideOverlay();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [isResultVisible, currentTheme]);

  if (!isReady || model.state !== 'loaded') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera 
        style={StyleSheet.absoluteFill} 
        device={device!} 
        isActive={!isResultVisible && isReady} 
        frameProcessor={frameProcessor} 
        pixelFormat="yuv" 
      />

      {!isResultVisible && (
        <View style={styles.overlayContainer}>
          <Image 
            source={require('../../../assets/common_IsStudent.png')} 
            style={styles.studentImage}
            resizeMode="contain"
          />
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>
              {studentStatus === "FOCUS" ? "선생님 말씀에 집중 중! 🔥" : 
               studentStatus === "SLEEPING" ? "깜빡 졸고 있어요! 💤" : "자리를 비우셨나요? 👀"}
            </Text>
          </View>
        </View>
      )}
      
      <ClassResultModal 
        visible={isResultVisible} 
        onClose={() => {
          setIsResultVisible(false);
          if (hasLevelUpData) setIsLevelUpVisible(true);
          else router.replace('/screens/Student_Home');
        }} 
        focusRate={resultData.focusRate} 
        currentXP={resultData.currentXP} 
        maxXP={resultData.maxXP} 
      />

      <LevelUpRewardModal 
        visible={isLevelUpVisible} 
        onClose={() => {
          setIsLevelUpVisible(false);
          router.replace('/screens/Student_Home');
        }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentImage: {
    width: '70%',
    height: '50%',
  },
  statusBox: {
    marginTop: 30,
    backgroundColor: 'white',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  }
});