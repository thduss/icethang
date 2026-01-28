import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';

const StatusReporter = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [myStatus, setMyStatus] = useState('정상');

  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => {
        setFeedbackMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  const reportStatus = (status: string) => {
    setMyStatus(status);
    setModalVisible(false);
    setFeedbackMessage(`선생님께 "${status}" 라고 말했어요! 😊`);

    // 여기다가 서버로 상태 전송(안보내도 되고)
    // 일정 시간 후 상태 초기화 (시간 합의 필요)
    if (status !== '정상') {
      setTimeout(() => {
        setMyStatus('정상');
      }, 10000);
    }
  };

  // 임시 서버 테스트 함수(나중에 지움)
  const triggerServerTest = () => {
    setFeedbackMessage("경고 멘트: 집중 필요!");
  };

  return (
    <View style={styles.container}>

      {feedbackMessage && (
        <View style={styles.balloon}>
          <Text style={styles.balloonText}>❗ {feedbackMessage}</Text>
          <View style={styles.balloonArrow} />
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

      {/* 임시 서버 테스트용 버튼 (나중에 삭제)*/}
      <TouchableOpacity onPress={triggerServerTest} style={styles.testBtn}>
        <Text style={styles.testBtnText}>서버알림 테스트</Text>
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
              onPress={() => reportStatus('화장실 갈래요')}
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
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    top: '6%',
    flexDirection: 'row',
    alignItems: 'center',
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
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },

  mainButtonText: {
    fontSize: 28,
  },

  mainButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
    color: '#5A4A2F',
  },

  testBtn: {
    position: 'absolute',
    bottom: -30,
    right: 0,
  },

  testBtnText: {
    fontSize: 10,
    color: '#ccc',
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
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  statusBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },

  closeBtn: {
    marginTop: 10,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 40,
    backgroundColor: '#d9d8d7'
  },
  closeBtnText: {
    color: '#070101',
    fontWeight: '700',
  },
});

export default StatusReporter;