import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Image, Animated, Dimensions, ImageBackground } from 'react-native';
import LottieView from 'lottie-react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store/stores';

const { width } = Dimensions.get('window');

// 🎨 에셋 매핑 (가진 번호에 맞춰 PNG/GIF 자동 대응 가능하도록 설정)
const CHARACTER_IMAGES: Record<number, any> = {
  5: require('../../assets/characters/5.png'), // 여기서부터 보상 가능성 높음
  6: require('../../assets/characters/6.png'),
  7: require('../../assets/characters/7.png'),
  8: require('../../assets/characters/8.png'),
};

interface LevelUpRewardModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LevelUpRewardModal({ visible, onClose }: LevelUpRewardModalProps) {
  const chestRef = useRef<LottieView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  // 🛠️ 'ownedCharacterIds' 속성 에러 방지를 위해 as any 사용
  const themeState = useSelector((state: RootState) => state.theme) as any;
  const ownedCharacterIds: number[] = themeState?.ownedCharacterIds || [];
  
  const [step, setStep] = useState<'closed' | 'opening' | 'opened'>('closed');

  // 🎁 보상 캐릭터 결정 로직
  const rewardInfo = useMemo(() => {
    // 현재 보유한 리스트 중 가장 큰 번호의 다음 번호를 보상으로 설정
    const lastId = ownedCharacterIds.length > 0 ? Math.max(...ownedCharacterIds) : 4;
    const nextId = lastId + 1;
    
    return {
      id: nextId,
      name: `새로운 친구 No.${nextId}`,
      image: CHARACTER_IMAGES[nextId] || CHARACTER_IMAGES[1] // 없을 경우 1번 기본값
    };
  }, [ownedCharacterIds, visible]);

  useEffect(() => {
    if (visible) {
      setStep('closed');
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.3);
      if (chestRef.current) chestRef.current.reset();
    }
  }, [visible]);

  const handleOpenChest = () => {
    setStep('opening');
    chestRef.current?.play();
  };

  const onChestOpened = () => {
    setStep('opened');
    // 캐릭터가 나타나는 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true })
    ]).start();
  };

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.outerContainer}>
        <ImageBackground 
          source={require('../../assets/reward_background.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.contentContainer}>
            <Text style={styles.titleText}>
              {step === 'opened' ? "새로운 동료가 생겼어요!" : "🎁 레벨업 축하 보상 🎁"}
            </Text>

            <View style={styles.animationArea}>
              {/* 폭죽 효과 */}
              {step === 'opened' && (
                <LottieView
                  source={require('../../assets/animations/confetti.json')}
                  autoPlay loop={false}
                  style={styles.confetti}
                />
              )}

              {/* 획득한 캐릭터 이미지 */}
              {step === 'opened' && (
                <Animated.View style={[styles.rewardBox, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                  <Image source={rewardInfo.image} style={styles.characterImage} resizeMode="contain" />
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{rewardInfo.name}</Text>
                  </View>
                </Animated.View>
              )}

              {/* 보물 상자 Lottie */}
              <LottieView
                ref={chestRef}
                source={require('../../assets/animations/treasure-chest.json')}
                loop={false}
                autoPlay={false}
                onAnimationFinish={onChestOpened}
                style={[
                  styles.chest,
                  step === 'opened' && { opacity: 0.3, transform: [{ translateY: 60 }, { scale: 0.7 }] }
                ]}
              />
            </View>

            <View style={styles.buttonArea}>
              {step === 'closed' ? (
                <TouchableOpacity style={styles.btnOpen} onPress={handleOpenChest}>
                  <Text style={styles.btnText}>상자 열기</Text>
                </TouchableOpacity>
              ) : step === 'opened' ? (
                <TouchableOpacity style={styles.btnConfirm} onPress={onClose}>
                  <Text style={styles.btnText}>수집 완료!</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.loadingText}>열리는 중...</Text>
              )}
            </View>
          </View>
        </ImageBackground>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: 'black' },
  backgroundImage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentContainer: { alignItems: 'center', width: '100%' },
  titleText: { fontSize: 30, fontWeight: '900', color: '#FFD700', marginBottom: 40, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 5 },
  animationArea: { width: width, height: 350, justifyContent: 'center', alignItems: 'center' },
  chest: { width: 300, height: 300 },
  confetti: { position: 'absolute', width: width * 1.5, height: width * 1.5 },
  rewardBox: { position: 'absolute', top: 0, alignItems: 'center', zIndex: 10 },
  characterImage: { width: 200, height: 200 },
  badge: { marginTop: 15, backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 3, borderColor: '#FFD700' },
  badgeText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  buttonArea: { height: 100, marginTop: 30, justifyContent: 'center' },
  btnOpen: { backgroundColor: '#FF6D00', paddingVertical: 15, paddingHorizontal: 50, borderRadius: 30, borderBottomWidth: 4, borderBottomColor: '#E65100' },
  btnConfirm: { backgroundColor: '#4CAF50', paddingVertical: 15, paddingHorizontal: 60, borderRadius: 30, borderBottomWidth: 4, borderBottomColor: '#2E7D32' },
  btnText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  loadingText: { color: 'white', fontSize: 18, fontWeight: '600' }
});