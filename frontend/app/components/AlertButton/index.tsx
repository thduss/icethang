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
    setFeedbackMessage(`선생님께 ${status} 알림을 보냈어요`);
    
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
      >
        <Text style={styles.mainButtonText}>🔔</Text>
      </TouchableOpacity>

      {/* 임시 서버 테스트용 버튼 (나중에 삭제)*/}
      <TouchableOpacity onPress={triggerServerTest} style={styles.testBtn}>
        <Text style={styles.testBtnText}>서버알림 테스트</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>선생님께 알려줘요</Text>
            
            <TouchableOpacity style={styles.statusBtn} onPress={() => reportStatus('화장실')}>
              <Text style={styles.statusBtnText}>🚽 화장실 갈래요 </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statusBtn} onPress={() => reportStatus('발표')}>
              <Text style={styles.statusBtnText}>🤚 발표 할래요 </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>취소</Text>
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
    top: '2%',
    alignItems: 'center',
    flexDirection: 'row', 
  },
  balloon: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
    backgroundColor: '#333',
    width: 70,
    height: 70,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#555', 
  },
  mainButtonText: {
    fontSize: 24,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statusBtn: {
    width: '100%',
    padding: 15,
    backgroundColor: '#2b2b2b',
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  statusBtnText: {
    fontSize: 16,
    color: '#fff',
  },
  closeBtn: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FF3B30'
  },
  closeBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default StatusReporter;