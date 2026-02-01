import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, AppState, SafeAreaView, Platform, StatusBar, TouchableOpacity } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import { Client, IMessage } from "@stomp/stompjs";
import { TextEncoder, TextDecoder } from "text-encoding";
import { SOCKET_CONFIG } from "../../api/socket";
import ClassProgressBar from "../../components/ClassProgressBar";
import TrafficLight from "../../components/TrafficLight";
import AlertButton, { AlertButtonRef } from "../../components/AlertButton";
import { useSelector } from "react-redux"; // 추가
import { RootState } from "../../store/stores"; // 추가 (store 경로에 맞게 수정)
import CalibrationModal from "../../components/Calibration"


(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

interface RouteParams {
  params: { classId?: string };
}

type AIStatus = "FOCUSED" | "BLINKING" | "MOVING" | "GAZE OFF" | "SLEEPING" | "AWAY";

export default function NormalClassScreen({ route }: { route: RouteParams }) {
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  
  const [cameraKey, setCameraKey] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const [aiStatus, setAiStatus] = useState<AIStatus>("FOCUSED");
  const [studentCount, setStudentCount] = useState(0);
const [showCalibration, setShowCalibration] = useState(false)
  const stompClient = useRef<Client | null>(null);
  const alertRef = useRef<AlertButtonRef>(null);
  const appStateRef = useRef(AppState.currentState);
  
  const classId = route?.params?.classId || "1";
  

  const studentData = useSelector((state: RootState) => state.auth.studentData);


  if (!studentData) {
    console.error("❌ studentData가 없습니다. 로그인 상태를 확인하세요.");
  }

  useEffect(() => {
    if (!isFocused || !permission?.granted) {
      setIsCameraReady(false);
      return;
    }

    const timer = setTimeout(() => {
      setCameraKey(prev => prev + 1);
    }, 300);

    return () => clearTimeout(timer);
  }, [isFocused, permission?.granted]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === "active") {
        if (isFocused && permission?.granted) {
          setCameraKey(prev => prev + 1);
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [isFocused, permission?.granted]);

  const sendStatusToServer = (status: AIStatus) => {
    if (!stompClient.current?.connected) {
      console.log("❌ 소켓 미연결 - 전송 불가");
      return;
    }

    
    if (!studentData) {
      console.error("❌ studentData 없음 - 서버 전송 불가");
      return;
    }

    let serverType: "FOCUS" | "UNFOCUS" | "AWAY";
    if (status === "FOCUSED") {
      serverType = "FOCUS";
    } else if (status === "AWAY") {
      serverType = "AWAY";
    } else {
      serverType = "UNFOCUS";
    }

    const payload = {
      classId: parseInt(classId),
      studentId: studentData.studentId, 
      studentName: studentData.studentName, 
      type: serverType,
      timestamp: new Date().toISOString()
    };

    console.log("📤 [서버로 전송]:", payload);

    stompClient.current.publish({
      destination: SOCKET_CONFIG.PUBLISH.ALERT,
      body: JSON.stringify(payload)
    });
  };

  useEffect(() => {
    if (isCameraReady && stompClient.current?.connected) {
      sendStatusToServer(aiStatus);
      
      if (aiStatus === "AWAY" || aiStatus === "SLEEPING" || 
          aiStatus === "BLINKING" || aiStatus === "MOVING" || aiStatus === "GAZE OFF") {
        alertRef.current?.triggerAlert(aiStatus);
      }
    }
  }, [aiStatus, isCameraReady]);

  useEffect(() => {
    if (!isFocused || !isCameraReady) {
      if (stompClient.current) {
        console.log("🔌 소켓 연결 해제");
        stompClient.current.deactivate();
        stompClient.current = null;
      }
      return;
    }

    if (stompClient.current?.connected) {
      console.log("✅ 소켓 이미 연결됨");
      return;
    }

    if (!studentData) {
      console.error("❌ studentData 없음 - WebSocket 연결 중단");
      return;
    }

    console.log("🔌 소켓 연결 시도");

    const client = new Client({
      webSocketFactory: () => new WebSocket(SOCKET_CONFIG.BROKER_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => { 
        if (!str.includes("PONG") && !str.includes("PING")) {
          console.log("📡 [STOMP]:", str); 
        }
      },
      
      onConnect: () => {
        console.log("✅ [STOMP]: 연결 성공!");
        
        client.subscribe(SOCKET_CONFIG.SUBSCRIBE.STUDENT_COUNT(classId), (msg: IMessage) => {
          try {
            const res = JSON.parse(msg.body);
            setStudentCount(res.count || 0);
          } catch (e) {
            console.error("❌ 학생 수 파싱 오류:", e);
          }
        });

        client.subscribe(SOCKET_CONFIG.SUBSCRIBE.CLASS_TOPIC(classId), (msg: IMessage) => {
          console.log("📥 [서버 피드백]:", msg.body);
          try {
            const res = JSON.parse(msg.body);
            if (res.studentId === studentData?.studentId) { // ✅ 실제 studentId로 비교
              const serverType = res.type;

              if (serverType === "AWAY" || serverType === "UNFOCUS") {
                alertRef.current?.triggerAlert(serverType);
              }
            }
          } catch (e) {
            console.error("❌ 서버 메시지 파싱 오류:", e);
          }
        });
        
        sendStatusToServer(aiStatus);
      },

      onStompError: (frame) => {
        console.error("❌ STOMP 오류:", frame.headers['message']);
      },

      onWebSocketClose: () => {
        console.log("🔌 WebSocket 연결 끊김");
      }
    });

    client.activate();
    stompClient.current = client;

    return () => {
      if (stompClient.current) {
        console.log("🧹 소켓 정리");
        stompClient.current.deactivate();
        stompClient.current = null;
      }
    };
  }, [isCameraReady, isFocused, studentData]); // ✅ studentData 의존성 추가


  const handleAIStatusUpdate = (statusString: string) => {
    console.log("🤖 AI SDK로부터 받은 상태:", statusString);
    const validStatuses: AIStatus[] = ["FOCUSED", "BLINKING", "MOVING", "GAZE OFF", "SLEEPING", "AWAY"];
    const upperStatus = statusString.toUpperCase();
    
    if (validStatuses.includes(upperStatus as AIStatus)) {
      setAiStatus(upperStatus as AIStatus);
    } else {
      console.warn("⚠️ 알 수 없는 AI 상태:", statusString);
    }
  };


  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={{ color: 'white' }}>카메라 권한 확인 중...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>카메라 권한 허용</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!studentData) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={{ color: 'white', fontSize: 16, textAlign: 'center' }}>
          학생 정보를 불러올 수 없습니다.{'\n'}다시 로그인해주세요.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      
      {isFocused && (
        <CameraView 
          key={cameraKey}
          style={StyleSheet.absoluteFill} 
          facing="front"
          onCameraReady={() => {
            console.log("📷 카메라 준비 완료");
            setTimeout(() => setIsCameraReady(true), 500);
          }}
        />
      )}

      <View style={styles.uiOverlay} pointerEvents="box-none">
        <View style={styles.topRow} pointerEvents="box-none">
          <View style={[styles.statusBadge, { 
            backgroundColor: aiStatus === "FOCUSED" ? "rgba(76,175,80,0.8)" : 
                            aiStatus === "AWAY" ? "rgba(244,67,54,0.8)" : 
                            "rgba(255,235,59,0.8)"
          }]}>
            <Text style={styles.statusText}>상태: {aiStatus}</Text>
          </View>
          <View style={[styles.socketBadge, {
            backgroundColor: stompClient.current?.connected ? "rgba(76,175,80,0.8)" : "rgba(158,158,158,0.8)"
          }]}>
          </View>
        </View>
        <View style={styles.rightMiddleSection} pointerEvents="box-none">
          <TrafficLight status={aiStatus} />
          <Text style={styles.countText}>👥 {studentCount}명</Text>
        </View>
        <AlertButton ref={alertRef} />

  

        <View style={styles.bottomSection} pointerEvents="box-none">
          
          <ClassProgressBar targetMinutes={1} />

          <CalibrationModal
                visible={showCalibration}
                onFinish={() => setShowCalibration(false)}
              />
                  
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#000" 
  },
  uiOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === "android" ? 15 : 0, 
    justifyContent: "space-between", 
    zIndex: 100 
  },
  topRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    width: "100%", 
    paddingTop: 10 
  },
  statusBadge: { 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: "rgba(255,255,255,0.3)" 
  },
  socketBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)"
  },
  statusText: { 
    color: "white", 
    fontWeight: "bold", 
    fontSize: 14 
  },
  rightMiddleSection: { 
    position: "absolute", 
    right: 20, 
    top: "35%", 
    alignItems: "center" 
  },
  countText: { 
    color: "white", 
    marginTop: 10, 
    fontSize: 14, 
    fontWeight: "600", 
    backgroundColor: "rgba(0,0,0,0.5)", 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 10 
  },
  bottomSection: { 
    width: "100%", 
    paddingBottom: Platform.OS === "android" ? 5 : 20, 
    alignItems: "center" 
  },
  permissionContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#000" 
  },
  permissionButton: { 
    padding: 15, 
    backgroundColor: "#007AFF", 
    borderRadius: 10 
  },
  permissionButtonText: { 
    color: "white", 
    fontWeight: "bold" 
  },
  testButtons: {
    position: 'absolute',
    left: 20,
    top: '12%',
    zIndex: 998,
  },
  testBtn: {
    backgroundColor: 'rgba(255,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  testBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});