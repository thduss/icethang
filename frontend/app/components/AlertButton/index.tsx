import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';

// 1. Props & Ref 타입 정의
export interface AlertButtonRef {
  triggerAlert: (type: string) => void;
}

interface AlertButtonProps {
  onStatusChange?: (status: string) => void; // 부모에게 알릴 함수
}

const AlertButton = forwardRef<AlertButtonRef, AlertButtonProps>((props, ref) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  // 2. 부모가 호출하는 함수 (선생님이 경고 보낼 때 등)
  useImperativeHandle(ref, () => ({
    triggerAlert: (type: string) => {
      // 학생 화면에 띄울 게 없다면 콘솔만 찍음
      console.log(`🔔 [경고 수신] 선생님으로부터 ${type} 경고가 왔습니다.`);
    }
  }));

  // 3. 학생이 버튼 눌러서 상태 보고할 때
  const reportStatus = (status: string) => {
    // (1) 모달 닫기
    setModalVisible(false);

    // (2) 콘솔 로그 (요청하신 대로)
    console.log(`📢 [학생 요청] 상태 선택됨: "${status}" -> 부모에게 전달합니다.`);

    // (3) 부모(NormalClassScreen)에게 전달 -> 여기서 소켓 쏠 예정
    if (props.onStatusChange) {
      props.onStatusChange(status);
    }
  };

  

  return (
    <View style={styles.container}>
      {/* 메인 버튼 */}
      <TouchableOpacity
        style={styles.mainButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.mainButtonText}>🔔</Text>
        <Text style={styles.mainButtonLabel}>알려주기</Text>
      </TouchableOpacity>

      {/* 선택 모달창 */}
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
              onPress={() => reportStatus('RESTROOM')}
            >
              <Text style={styles.statusBtnText}>🚽 화장실 갈래요!</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusBtn, { backgroundColor: '#caebfb' }]}
              onPress={() => reportStatus('ACTIVITY')}
            >
              <Text style={styles.statusBtnText}>✋ 발표 할래요!</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  mainButton: {
    width: 80, height: 80, backgroundColor: '#FFE066', borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', elevation: 5,
  },
  mainButtonText: { fontSize: 28 },
  mainButtonLabel: { fontSize: 15, fontWeight: '700', marginTop: 2, color: '#5A4A2F' },
  
  // 모달 스타일
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalView: { width: '80%', backgroundColor: '#ffffff', borderRadius: 24, padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 25, fontWeight: '800', marginBottom: 18 },
  statusBtn: { width: '100%', paddingVertical: 18, borderRadius: 26, marginBottom: 14, alignItems: 'center', elevation: 4 },
  statusBtnText: { fontSize: 20, fontWeight: '700', color: '#333' },
  closeBtn: { marginTop: 10, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 40, backgroundColor: '#d9d8d7' },
  closeBtnText: { color: '#070101', fontWeight: '700' },
});

export default AlertButton;