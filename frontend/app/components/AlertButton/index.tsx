import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';

export interface AlertButtonRef {
  triggerAlert: (type: string) => void;
}

interface AlertButtonProps {
  onStatusChange?: (status: string) => void;
  onReturn?: () => void;
}

const AlertButton = forwardRef<AlertButtonRef, AlertButtonProps>((props, ref) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState('');
  const [bubbleOpacity] = useState(new Animated.Value(0));
  const [isPaused, setIsPaused] = useState(false);
  const [pauseType, setPauseType] = useState<'RESTROOM' | 'ACTIVITY' | null>(null);

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
      console.log(`[경고 수신] AI 감지: ${type}`);

      if (type === 'MOVING' || type === 'UNFOCUS') {
        showBubbleWithMessage('경고 멘트 : 집중 필요!');
      }
    }
  }));

  const reportStatus = (status: 'RESTROOM' | 'ACTIVITY') => {
    setModalVisible(false);

    console.log(`[학생 요청] 상태 선택됨: "${status}" -> 전달합니다.`);

    if (props.onStatusChange) {
      props.onStatusChange(status);
    }

    setPauseType(status);
    setIsPaused(true);
  };

  const handleReturn = () => {
    console.log(`[학생 복귀] "${pauseType}" 상태에서 복귀합니다.`);
    setIsPaused(false);
    setPauseType(null);

    if (props.onReturn) {
      props.onReturn();
    }
  };

  const pauseConfig = {
    RESTROOM: {
      icon: '🚽',
      title: '화장실 가는 중이에요!',
      subtitle: '다녀오면 아래 버튼을 눌러주세요',
      buttonText: '복귀했어요!',
      buttonColor: '#FFE066',
      overlayColor: 'rgba(255, 224, 102, 0.15)',
    },
    ACTIVITY: {
      icon: '✋',
      title: '발표 중이에요!',
      subtitle: '발표가 끝나면 아래 버튼을 눌러주세요',
      buttonText: '발표 끝!',
      buttonColor: '#90CAF9',
      overlayColor: 'rgba(144, 202, 249, 0.15)',
    },
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
            <Text style={styles.modalTitle}>선생님께 알려줘요</Text>

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

      {/* 일시정지 오버레이 (화장실/발표 중) */}
      <Modal
        animationType="fade"
        transparent
        visible={isPaused}
        supportedOrientations={['landscape', 'portrait']}
      >
        <View style={[styles.pauseOverlay, pauseType && { backgroundColor: pauseConfig[pauseType].overlayColor }]}>
          <View style={styles.pauseBackdrop} />
          <View style={styles.pauseContent}>
            <Text style={styles.pauseIcon}>
              {pauseType ? pauseConfig[pauseType].icon : ''}
            </Text>
            <Text style={styles.pauseTitle}>
              {pauseType ? pauseConfig[pauseType].title : ''}
            </Text>
            <Text style={styles.pauseSubtitle}>
              {pauseType ? pauseConfig[pauseType].subtitle : ''}
            </Text>
            <TouchableOpacity
              style={[
                styles.returnBtn,
                { backgroundColor: pauseType ? pauseConfig[pauseType].buttonColor : '#FFE066' },
              ]}
              onPress={handleReturn}
              activeOpacity={0.8}
            >
              <Text style={styles.returnBtnText}>
                {pauseType ? pauseConfig[pauseType].buttonText : '복귀'}
              </Text>
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
    right: 115,
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

  // 일시정지 오버레이 스타일
  pauseOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  pauseContent: {
    alignItems: 'center',
    zIndex: 1,
    padding: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  pauseIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  pauseTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
  },
  pauseSubtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 30,
  },
  returnBtn: {
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  returnBtnText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
  },
});

export default AlertButton;
