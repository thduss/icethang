import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Image, Animated, Dimensions, ImageBackground } from 'react-native';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

interface LevelUpRewardModalProps {
  visible: boolean;
  onClose: () => void;
  rewardName?: string;
}

export default function LevelUpRewardModal({ visible, onClose, rewardName = "새로운 캐릭터" }: LevelUpRewardModalProps) {
  const chestRef = useRef<LottieView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  const [step, setStep] = useState<'closed' | 'opening' | 'opened'>('closed');

  useEffect(() => {
    if (visible) {
      setStep('closed');
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.3);
      if (chestRef.current) {
        chestRef.current.reset();
      }
    }
  }, [visible]);

  const handleOpenChest = () => {
    setStep('opening');
    chestRef.current?.play();
  };

  const onChestOpened = () => {
    setStep('opened');
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true })
    ]).start();
  };

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <ImageBackground 
        source={require('../../assets/reward_background.png')}
        style={styles.overlay}
        resizeMode="cover"
      >
        <View style={styles.contentContainer}>
          
          {/* 타이틀 */}
          <Text style={styles.titleText}>
            {step === 'opened' ? "축하합니다!" : "🎁 레벨업 보상 도착! 🎁"}
          </Text>

          {/* 애니메이션 영역 */}
          <View style={styles.animationArea}>
            
            {/* 폭죽 */}
            {step === 'opened' && (
              <LottieView
                source={require('../../assets/animations/confetti.json')}
                autoPlay loop={false}
                style={styles.confetti}
                resizeMode="cover"
              />
            )}

            {/* 보상 아이템  */}
            {step === 'opened' && (
              <Animated.View style={[styles.rewardItemBox, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                <Image 
                  source={require('../../assets/common_IsStudent.png')} 
                  style={{ width: 180, height: 180 }}
                  resizeMode="contain"
                />
                <View style={styles.rewardNameBadge}>
                    <Text style={styles.rewardNameText}>{rewardName}</Text>
                </View>
              </Animated.View>
            )}

            {/* 보물상자 Lottie */}
            <LottieView
              ref={chestRef}
              source={require('../../assets/animations/treasure-chest.json')}
              loop={false}
              autoPlay={false}
              onAnimationFinish={onChestOpened}
              style={styles.chestLottie}
            />
          </View>

          {/* 하단 버튼 영역 */}
          <View style={styles.buttonArea}>
            {step === 'closed' ? (
              <TouchableOpacity style={styles.openButton} onPress={handleOpenChest}>
                <Text style={styles.openButtonText}>보상 상자 열기</Text>
              </TouchableOpacity>
            ) : step === 'opened' ? (
              <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
                <Text style={styles.confirmButtonText}>확인</Text>
              </TouchableOpacity>
            ) : (
              <Text style={{color: 'white', fontSize: 18, fontWeight:'bold'}}>두근두근...</Text>
            )}
          </View>

        </View>
      </ImageBackground>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
  },
  titleText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFD700',
    marginBottom: 50,
    textShadowColor: 'rgba(255,160,0,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  animationArea: {
    width: 400,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  chestLottie: {
    width: 350,
    height: 350,
    zIndex: 1,
  },
  confetti: {
    position: 'absolute',
    width: 700,
    height: 700,
    zIndex: 2,
  },
  rewardItemBox: {
    position: 'absolute',
    top: -60, 
    alignItems: 'center',
    zIndex: 10,
  },
  rewardNameBadge: {
    marginTop: 10,
    backgroundColor: 'white',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: '#FFD700',
  },
  rewardNameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5D4037',
  },
  buttonArea: {
    height: 100,
    justifyContent: 'center',
  },
  openButton: {
    backgroundColor: '#FF6F00',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 40,
    borderBottomWidth: 6,
    borderBottomColor: '#BF360C',
    elevation: 5,
  },
  openButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    paddingHorizontal: 70,
    borderRadius: 40,
    borderBottomWidth: 6,
    borderBottomColor: '#2E7D32',
    elevation: 5,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
});