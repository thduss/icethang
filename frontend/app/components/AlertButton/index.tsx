import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';

export interface AlertButtonRef {
  triggerAlert: (type: string) => void;
}

interface AlertButtonProps {
  onStatusChange?: (status: string) => void;
}

const AlertButton = forwardRef<AlertButtonRef, AlertButtonProps>((props, ref) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState('');
  const [bubbleOpacity] = useState(new Animated.Value(0));
  
  const showBubbleWithMessage = (message: string) => {
    setBubbleMessage(message);
    setShowSpeechBubble(true);

    Animated.timing(bubbleOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    setTimeout(() => {
      Animated.timing(bubbleOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowSpeechBubble(false);
      });
    }, 3000);
  };
  
  useImperativeHandle(ref, () => ({
    triggerAlert: (type: string) => {
      console.log(`🔔 [경고 수신] AI 감지: ${type}`);
      
      if (type === 'MOVING' || type === 'UNFOCUS') {
        showBubbleWithMessage('⚠️ 경고 멘트 : 집중 필요!');
      }
    }
  }));
  const reportStatus = (status: string) => {
    setModalVisible(false);

    console.log(`📢 [학생 요청] 상태 선택됨: "${status}" -> 전달합니다.`);

    if (props.onStatusChange) {
      props.onStatusChange(status);
    }
    
    const messageMap: { [key: string]: string } = {
      'RESTROOM': '🚽 선생님께 화장실 알림을 보냈어요!',
      'ACTIVITY': '✋ 선생님께 발표 알림을 보냈어요!',
    };
    
    const confirmMessage = messageMap[status];
    if (confirmMessage) {
      showBubbleWithMessage(confirmMessage);
    }
  };

  return (
    <View style={styles.container}>
      {showSpeechBubble && (
        <Animated.View style={[styles.speechBubble, { opacity: bubbleOpacity }]}>
          <Text style={styles.speechBubbleText}>{bubbleMessage}</Text>
          <View style={styles.speechBubbleTail} />
        </Animated.View>
      )}

      <TouchableOpacity
        style={styles.mainButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.mainButtonText}>🔔</Text>
        <Text style={styles.mainButtonLabel}>HELP</Text>
      </TouchableOpacity>

      {/* 선택 모달창 (학생이 버튼 클릭) */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        supportedOrientations={['landscape', 'portrait']} 
        
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
  container: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-end' 
  },
  
  speechBubble: {
    position: 'absolute',
    right: 115, // 버튼 왼쪽에 위치
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  speechBubbleTail: {
    position: 'absolute',
    right: -10,
    top: '50%',
    marginTop: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: '#FFFFFF',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  speechBubbleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
  },
  
  mainButton: {
    width: 100,  
    height: 100, 
    backgroundColor: '#FFE066',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mainButtonText: { 
    fontSize: 36  
  },
  mainButtonLabel: { 
    fontSize: 16,  
    fontWeight: '700', 
    marginTop: 4, 
    color: '#5A4A2F' 
  },
  
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalView: { 
    width: '80%', 
    transform: [{ rotate: '0deg' }],
    backgroundColor: '#ffffff', 
    borderRadius: 24, 
    padding: 24, 
    alignItems: 'center' 
  },
  modalTitle: { 
    fontSize: 25, 
    fontWeight: '800', 
    marginBottom: 18 
  },
  statusBtn: { 
    width: '100%', 
    paddingVertical: 18, 
    borderRadius: 26, 
    marginBottom: 14, 
    alignItems: 'center', 
    elevation: 4 
  },
  statusBtnText: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#333' 
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
    fontWeight: '700' 
  },
});

export default AlertButton;