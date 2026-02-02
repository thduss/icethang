import React, { useEffect, useState, useRef, useCallback } from "react"
import { Text, View, Alert, Linking, TouchableOpacity, StyleSheet, AppState } from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import { useRouter } from "expo-router";
import ClassProgressBar from "../../components/ClassProgressBar"
import AlertButton, { AlertButtonRef } from "../../components/AlertButton"
import TrafficLight from "../../components/TrafficLight";
import CalibrationModal from "../../components/Calibration"
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { SOCKET_CONFIG } from "../../api/socket";
import { useSelector } from "react-redux";
import { RootState } from "../../store/stores";


type AIStatus = "FOCUSED" | "BLINKING" | "MOVING" | "GAZE OFF" | "SLEEPING" | "AWAY" | "RESTROOM" | "ACTIVITY" 

interface StudentInfo {
  id: number;
  name: string;
  classId: number;
}

export default function NormalClassScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions()
  const [showCalibration, setShowCalibration] = useState(false)

  const checkPermissions = async () => {
    if (!permission) return
    if (permission.status !== "granted") {
      if (!permission.canAskAgain) {
        Alert.alert(
          "권한 필요",
          "앱 설정에서 카메라 권한을 변경해주세요.",
          [
            { text: "취소", style: "cancel" },
            { text: "설정 열기", onPress: () => Linking.openSettings() },
          ],
          { cancelable: false }
        )
      } else {
        requestPermission()
      }
    }
  }
  
  const [aiStatus, setAiStatus] = useState<AIStatus>("FOCUSED");
  const [studentCount, setStudentCount] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false); 
  
  const stompClient = useRef<Client | null>(null);
  const alertRef = useRef<AlertButtonRef>(null);
  const appStateRef = useRef(AppState.currentState);
  
  const studentData = useSelector((state: RootState) => state.auth.studentData);
  const classId = studentData?.classId?.toString() || "1"; 
  const countsRef = useRef({ away: 0, unfocus: 0 });

  const studentInfo: StudentInfo = {
    id: studentData?.studentId || 4,
    name: studentData?.studentName || "김싸피", 
    classId: studentData?.classId || 1,  
  };

  useEffect(() => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("👤 [학생 정보 확인]");
    console.log("   Redux studentData:", studentData);
    console.log("   사용할 studentInfo:", studentInfo);
    console.log("   classId:", classId);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  }, [studentData]);

  const handleCameraReady = () => {
    console.log("📷 카메라 준비 완료");
    setTimeout(() => setIsCameraReady(true), 500);
  };

  const sendStatusToServer = (status: AIStatus) => {
    if (!isSocketConnected) {
      console.log("❌ 소켓 미연결 - 전송 불가");
      return;
    }

    let serverType: "FOCUS" | "UNFOCUS" | "AWAY";
    if (status === "FOCUSED" || status === "RESTROOM" || status === "ACTIVITY") {
      serverType = "FOCUS";
    } else if (status === "AWAY") {
      countsRef.current.away += 1;
      serverType = "AWAY";
    } else {
      countsRef.current.unfocus += 1;
      serverType = "UNFOCUS";
    }

    const payload = {
      classId: parseInt(classId),
      studentId: studentInfo.id,
      studentName: studentInfo.name,
      type: serverType,
      timestamp: new Date().toISOString(),
      totalAwayCount: countsRef.current.away,       
      totalUnfocusCount: countsRef.current.unfocus
    };

    
    
    const destination = SOCKET_CONFIG.PUBLISH.ALERT;
    
    console.log("📤 [서버로 전송]:", payload);
    console.log("📍 [목적지]:", destination);

    if (!destination) {
      console.error("❌ destination이 undefined! SOCKET_CONFIG를 확인하세요.");
      console.error("SOCKET_CONFIG.PUBLISH:", SOCKET_CONFIG.PUBLISH);
      return;
    }

    stompClient.current!.publish({
      destination: destination,
      body: JSON.stringify(payload)
    });
  };

 
  useEffect(() => {
    console.log("🔄 [aiStatus 변경됨]:", aiStatus);
    console.log("📷 [카메라 준비 상태]:", isCameraReady);
    console.log("🔌 [소켓 연결 상태]:", isSocketConnected);
    
    if (isCameraReady && isSocketConnected) {
      console.log("✅ [조건 충족 - sendStatusToServer 호출]");
      sendStatusToServer(aiStatus);
      
      if (aiStatus === "AWAY" || aiStatus === "SLEEPING" || 
          aiStatus === "BLINKING" || aiStatus === "MOVING" || aiStatus === "GAZE OFF") {
        console.log("⚡ 자체 알림 트리거:", aiStatus);
        alertRef.current?.triggerAlert(aiStatus);
      }
    } else {
      console.log("⚠️ [조건 불충족]", {
        isCameraReady,
        isSocketConnected
      });
    }
  }, [aiStatus, isCameraReady, isSocketConnected]);


  useEffect(() => {
    if (!isCameraReady) {
      if (stompClient.current) {
        console.log("🔌 소켓 연결 해제");
        stompClient.current.deactivate();
        stompClient.current = null;
        setIsSocketConnected(false);
      }
      return;
    }

    if (stompClient.current?.connected) {
      console.log("✅ 소켓 이미 연결됨");
      return;
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔌 SockJS 소켓 연결 시도...");
    console.log("📍 URL:", SOCKET_CONFIG.BROKER_URL);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const client = new Client({
      webSocketFactory: () => new SockJS(SOCKET_CONFIG.BROKER_URL),
      reconnectDelay: SOCKET_CONFIG.RECONNECT_DELAY,
      heartbeatIncoming: SOCKET_CONFIG.HEARTBEAT,
      heartbeatOutgoing: SOCKET_CONFIG.HEARTBEAT,
      
   
      debug: (str) => {
        console.log("📡 [STOMP]:", str);
      },
      
      onConnect: (frame) => {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("✅✅✅ [STOMP] CONNECTED!");
        console.log("Frame:", frame);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        setIsSocketConnected(true);
        
        console.log("📮 구독 시작: STUDENT_COUNT");
        client.subscribe(
          SOCKET_CONFIG.SUBSCRIBE.STUDENT_COUNT(classId), 
          (msg: IMessage) => {
            console.log("📥 [학생 수]:", msg.body);
            try {
              const res = JSON.parse(msg.body);
              setStudentCount(res.count || 0);
            } catch (e) {
              console.error("학생 수 파싱 오류:", e);
            }
          }
        );

        
        console.log("📮 구독 시작: CLASS_TOPIC");
        client.subscribe(
          SOCKET_CONFIG.SUBSCRIBE.CLASS_TOPIC(classId), 
          (msg: IMessage) => {
            console.log("📥 [서버 피드백 - 전체]:", msg.body);
            try {
              const res = JSON.parse(msg.body);
              console.log("📥 [파싱된 데이터]:", res);
              
              if (res.studentId === studentInfo.id) {
                const serverType = res.type;
                
                if (serverType === "AWAY" || serverType === "UNFOCUS") {
                  console.log("🚨 [알림 트리거]:", serverType);
                  alertRef.current?.triggerAlert(serverType);
                }
              }
            } catch (e) {
              console.error("서버 메시지 파싱 오류:", e);
            }
          }
        );

        console.log("📤 초기 상태 전송");
        sendStatusToServer(aiStatus);
      },

      onStompError: (frame) => {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ [STOMP] 오류 발생!");
        console.error("Command:", frame.command);
        console.error("Headers:", frame.headers);
        console.error("Body:", frame.body);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        setIsSocketConnected(false);
      },

      onWebSocketClose: (event) => {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🔌 [WebSocket] 연결 끊김");
        console.log("Code:", event?.code);
        console.log("Reason:", event?.reason || "이유 없음");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        setIsSocketConnected(false);
      },
      
      onWebSocketError: (event) => {
        console.error("❌ [WebSocket] 에러:", event);
      }
    });

    client.activate();
    stompClient.current = client;

    return () => {
      if (stompClient.current) {
        console.log("🧹 소켓 정리");
        stompClient.current.deactivate();
        stompClient.current = null;
        setIsSocketConnected(false);
      }
    };
  }, [isCameraReady]);

  
  const handleAIStatusUpdate = (statusString: string) => {
    console.log("🤖 AI SDK로부터 받은 상태:", statusString);
    const validStatuses: AIStatus[] = ["FOCUSED", "BLINKING", "MOVING", "GAZE OFF", "SLEEPING", "AWAY","RESTROOM","ACTIVITY"];
    const upperStatus = statusString.toUpperCase();
    
    if (validStatuses.includes(upperStatus as AIStatus)) {
      setAiStatus(upperStatus as AIStatus);
    }
  };



  useEffect(() => {
    checkPermissions()
  }, [permission?.status])

  useEffect(() => {
    if (permission?.status === "granted") {
      setShowCalibration(true)
    }
  }, [permission])

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{color: 'white'}}>로딩 중...</Text>
      </View>
    )
  }

  if (permission.status !== "granted") {
    return (
      <View style={styles.permissionContainer}>
        <Text style={{ fontSize: 16, color: 'white' }}>카메라 권한이 필요합니다.</Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonText}>권한 요청</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={StyleSheet.absoluteFill} 
        facing="front"
        onCameraReady={handleCameraReady}
      />
      <View style={styles.bottomOverlay}>
         <ClassProgressBar targetMinutes={1} />
      </View>
    
      <View style={styles.rightCenterContainer}>
        <TrafficLight status={aiStatus} />
        <Text style={styles.countText}>👥 {studentCount}명</Text>
      </View>

      <View style={styles.alertButtonContainer}>
        <AlertButton ref={alertRef} />
      </View>

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
    backgroundColor: 'black',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
 
  rightCenterContainer: {
    position: 'absolute', 
    right: 30,            
    top: '40%',           
    transform: [{ translateY: -50 }],
    zIndex: 10,           
    alignItems: 'center',
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

  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },

  alertButtonContainer: {
    position: 'absolute',
    top: 50,
    right: 30,
    zIndex: 10,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: 'black',
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
})