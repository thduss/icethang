import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import RewardModal from 'app/components/RewardModal';

export default function ReusableGridScreen() {
  const { theme } = useAppTheme();
  const chestRef = useRef<LottieView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 상태 관리 DB랑 연결
  const [totalExp, setTotalExp] = useState(12000); 
  const [modalVisible, setModalVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isOpened, setIsOpened] = useState(false);

  //  경험치 로직 (차이만큼 넣은건데 추후 DB와 수정)
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
      <View style={styles.header}>
        
        <Text style={[styles.title, { color: theme.text }]}>🌟 보물 상자 열기 🌟</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>수업에 열심히 참여해 경험치를 얻어보세요!</Text>
      </View>
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

      <RewardModal
        visible={modalVisible}
        onClose={handleCloseModal}
        theme={theme}
      />
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
  progressSection: { width: '80%', marginBottom: 30 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  expText: { fontSize: 14 },
  progressBarBackground: { height: 12, width: '100%', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 6 },
  rewardButton: { width: '40%', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});