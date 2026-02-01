import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';

export interface AlertButtonRef {
  triggerAlert: (type: string) => void;
}

interface AlertButtonProps {}

const AlertButton = forwardRef<AlertButtonRef, AlertButtonProps>((props, ref) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [myStatus, setMyStatus] = useState('정상');

  useImperativeHandle(ref, () => ({
    triggerAlert: (type: string) => {
      console.log("🔔 AlertButton.triggerAlert 호출됨! type:", type);
      
      if (type === 'AWAY' || type === 'UNFOCUS' || type === 'SLEEPING' || type === 'GAZE OFF') {
        setFeedbackMessage("⚠️ 경고! 집중요망: 화면을 확인하세요!");
        setMyStatus(type);
        console.log("✅ 팝업 메시지 설정 완료!");
      } else {
        console.log("❌ 조건 미충족, type:", type);
      }
    }
  }));

  useEffect(() => {
    if (feedbackMessage) {
      console.log("📢 팝업 표시 중:", feedbackMessage);
      const timer = setTimeout(() => {
        setFeedbackMessage(null);
        console.log("📢 팝업 숨김");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  const reportStatus = (status: string) => {
    setMyStatus(status);
    setModalVisible(false);
    setFeedbackMessage(`선생님께 "${status}" 라고 말했어요! 😊`);

    if (status !== '정상') {
      setTimeout(() => {
        setMyStatus('정상');
      }, 10000);
    }
  };

  return (
    <View style={styles.container}>

      {feedbackMessage && (
        <View style={[
          styles.balloon,

          feedbackMessage.includes("경고") && { backgroundColor: '#FFF9C4', borderColor: '#FBC02D', borderWidth: 1 }
        ]}>
          <Text style={styles.balloonText}>❗ {feedbackMessage}</Text>
          <View style={[
            styles.balloonArrow,
            feedbackMessage.includes("경고") && { borderLeftColor: '#FFF9C4' }
          ]} />
        </View>
      )}

 
      <TouchableOpacity
        style={styles.mainButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.mainButtonText}>🔔</Text>
        <Text style={styles.mainButtonLabel}>알려주기</Text>
      </TouchableOpacity>

      

      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>선생님께 알려줘요 ✨</Text>

            <TouchableOpacity
              style={[styles.statusBtn, { backgroundColor: '#feeeb4' }]}
              onPress={() => reportStatus('화장실 갈래요')
                // 참고로 화장실이랑 발표는 아직 서버 전송 미구현
              }
            >
              <Text style={styles.statusBtnText}>🚽 화장실 갈래요!</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusBtn, { backgroundColor: '#caebfb' }]}
              onPress={() => reportStatus('발표 할래요')}
            >
              <Text style={styles.statusBtnText}>✋ 발표 할래요!</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    top: '12%', 
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999,
  },
  balloon: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    top: 20, 
  },
  balloonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 13,
  },
  balloonArrow: {
    position: 'absolute',
    right: -10,
    top: 12,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 10,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#ffffff',
  },
  mainButton: {
    width: 80,
    height: 80,
    backgroundColor: '#FFE066',
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    top: 20, 
  },
  mainButtonText: { fontSize: 28 },
  mainButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
    color: '#5A4A2F',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 25,
    fontWeight: '800',
    marginBottom: 18,
  },
  statusBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 26,
    marginBottom: 14,
    alignItems: 'center',
    elevation: 4,
  },
  statusBtnText: { fontSize: 20, fontWeight: '700', color: '#333' },
  closeBtn: {
    marginTop: 10,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 40,
    backgroundColor: '#d9d8d7'
  },
  closeBtnText: { color: '#070101', fontWeight: '700' },
});

export default AlertButton;