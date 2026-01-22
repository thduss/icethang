import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Image, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { useAppTheme } from '../../context/ThemeContext';

export default function ReusableGridScreen() {
  const { theme } = useAppTheme();
  const chestRef = useRef<LottieView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 상태 관리 
  const [totalExp, setTotalExp] = useState(12000); // DB 데이터 (예시)
  const [modalVisible, setModalVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isOpened, setIsOpened] = useState(false);

  //  경험치 로직 (차이만큼)
  const rewardThresholds = [100, 300, 600, 1000];
  const nextThreshold = rewardThresholds.find(t => t > (totalExp - 1)) || 1000;
  const prevThreshold = rewardThresholds[rewardThresholds.indexOf(nextThreshold) - 1] || 0;
  const currentLevelExp = totalExp - prevThreshold;
  const levelGoalExp = nextThreshold - prevThreshold;
  const progressWidth = (currentLevelExp / levelGoalExp) * 100;
  const isReadyToReward = totalExp >= nextThreshold;

  // 보상 열기 함수
  const handleOpenReward = () => {
    setShowConfetti(false);
    setIsOpened(false);
    fadeAnim.setValue(0);
    setModalVisible(true);
    
    setTimeout(() => {
      chestRef.current?.play();
    }, 100);
  };

  const onChestFinish = () => {
    setShowConfetti(true);
    setIsOpened(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* --- 메인 화면 헤더 --- */}
      <View style={styles.header}>
        
        <Text style={[styles.title, { color: theme.text }]}>🌟 보물 상자 열기 🌟</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>수업에 열심히 참여해 경험치를 얻어보세요!</Text>
      </View>

      {/* --- 메인 화면 콘텐츠 --- */}
      <View style={styles.content}>
        <View style={styles.mainBoxContainer}>
            <LottieView
                    source={require('../../../assets/animations/story.json')}
                    autoPlay
                    loop={true}
                  />
        </View>

        {/* 프로그레스 바 (경험치 비례) */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={[styles.expText, { color: theme.text }]}>다음 보상까지</Text>
            <Text style={[styles.expText, { color: theme.primary, fontWeight: 'bold' }]}>
              {currentLevelExp} / {levelGoalExp}
            </Text>
          </View>
          <View style={[styles.progressBarBackground, { backgroundColor: theme.card }]}>
            <View style={[styles.progressBarFill, { width: `${Math.min(progressWidth, 100)}%`, backgroundColor: theme.primary }]} />
          </View>
        </View>

        <Pressable 
          onPress={handleOpenReward}
          disabled={!isReadyToReward}
          style={[
            styles.rewardButton, 
            { backgroundColor: isReadyToReward ? theme.primary : '#A1A1A1' }
          ]}
        >
          <Text style={styles.buttonText}>
            {isReadyToReward ? "보상 상자 열기" : "경험치 부족"}
          </Text>
        </Pressable>
      </View>

      {/* --- 보상 연출 모달 --- */}
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            
            <Text style={[styles.congratsText, { color: theme.text }]}>
              {isOpened ? "축하합니다!" : "상자를 여는 중..."}
            </Text>

            <View style={styles.animationWrapper}>
              {/* 상자 애니메이션 */}
              <LottieView
                ref={chestRef}
                source={require('../../../assets/animations/treasure-chest.json')}
                loop={false}
                autoPlay={false}
                style={styles.modalLottie}
                onAnimationFinish={onChestFinish}
              />

              {/* 폭죽 애니메이션 */}
              {showConfetti && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  <LottieView
                    source={require('../../../assets/animations/confetti.json')}
                    autoPlay
                    loop={false}
                    style={styles.confettiLottie}
                  />
                </View>
              )}

              {/* 보상 텍스트 (아이템 이미지 들어갈거임) */}
              {isOpened && (
                <Animated.View style={[styles.itemPlaceholder, { opacity: fadeAnim }]}>
                  <Text style={[styles.rewardInfoText, { color: theme.primary }]}>
                    🎁 보상 획득 완료!
                  </Text>
                </Animated.View>
              )}
            </View>

            {isOpened && (
              <Pressable 
                style={[styles.closeButton, { backgroundColor: theme.primary }]}
                onPress={handleCloseModal}
              >
                <Text style={styles.closeButtonText}>닫기</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 80 },
  header: { alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 8 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  mainBoxContainer: { marginBottom: 40 },
  mainBoxImage: { width: 150, height: 150 },
  progressSection: { width: '80%', marginBottom: 30 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  expText: { fontSize: 14 },
  progressBarBackground: { height: 12, width: '100%', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 6 },
  rewardButton: { width: '40%', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '80%',
    padding: 25,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 5,
  },
  animationWrapper: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLottie: {
    width: 280,
    height: 280,
  },
  confettiLottie: {
    flex: 1,
  },
  itemPlaceholder: {
    position: 'absolute',
    top: '30%',
    alignItems: 'center',
    zIndex: 10,
  },
  rewardInfoText: {
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 10,
  },
  congratsText: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  closeButton: { marginTop: 20, paddingHorizontal: 60, paddingVertical: 14, borderRadius: 15},
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});