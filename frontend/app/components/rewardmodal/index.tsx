import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

interface RewardModalProps {
  visible: boolean;
  onClose: () => void;
  theme: any;
  rewardName?: string;
}

export default function RewardModal({ visible, onClose, theme, rewardName = "보상" }: RewardModalProps) {
  const chestRef = useRef<LottieView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isOpened, setIsOpened] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (visible) {
      // 모달이 열릴 때 상태 초기화
      setIsOpened(false);
      setShowConfetti(false);
      fadeAnim.setValue(0);
      // 약간의 지연 후 상자 애니메이션 시작
      setTimeout(() => {
        chestRef.current?.play();
      }, 100);
    }
  }, [visible]);

  const onChestFinish = () => {
    setShowConfetti(true);
    setIsOpened(true);
    // 보상 텍스트 서서히 나타나기
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <Text style={[styles.congratsText, { color: theme.text }]}>
            {isOpened ? "축하합니다!" : "상자를 여는 중..."}
          </Text>

          <View style={styles.animationWrapper}>
            
            <LottieView
              ref={chestRef}
              source={require('../../../assets/animations/treasure-chest.json')}
              loop={false}
              autoPlay={false}
              onAnimationFinish={onChestFinish}
              style={styles.modalLottie}
            />

            {showConfetti && (
              <View style={styles.confettiWrapper} pointerEvents="none">
                <LottieView
                  source={require('../../../assets/animations/confetti.json')}
                  autoPlay
                  loop={false}
                  style={styles.confettiLottie}
                  resizeMode="cover"
                />
              </View>
            )}

            {isOpened && (
              <Animated.View style={[styles.itemPlaceholder, { opacity: fadeAnim }]}>
                <Text style={[styles.rewardInfoText, { color: theme.primary }]}>
                  🎁 {rewardName} 획득 완료!
                </Text>
              </Animated.View>
            )}
          </View>

          {isOpened && (
            <Pressable 
              style={[styles.closeButton, { backgroundColor: theme.primary }]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>닫기</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '85%',
    padding: 25,
    borderRadius: 30, 
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  animationWrapper: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    position: 'relative', 
  },
  modalLottie: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  confettiWrapper: {
    position: 'absolute',
    top: -50, 
    left: -60,
    right: -60,
    bottom: -50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2, 
  },
  confettiLottie: {
    width: '140%', 
    height: '140%',
  },
  itemPlaceholder: {
    position: 'absolute',
    top: '15%', 
    alignItems: 'center',
    zIndex: 10,
  },
  rewardInfoText: {
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.95)', 
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
    textAlign: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  congratsText: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 5 
  },
  closeButton: { 
    marginTop: 25, 
    paddingHorizontal: 60, 
    paddingVertical: 15, 
    borderRadius: 20,
  },
  closeButtonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
});