import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Image, ImageBackground, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ExperienceBar from './ExpBar'; 

interface ClassResultModalProps {
  visible: boolean;
  onClose: () => void;
  focusRate?: number;   // 이번 수업에서 획득한 점수 (획득 경험치)
  currentXP?: number;   // 현재 레벨 내에서의 진행 경험치
  maxXP?: number;       // 현재 레벨의 최대 경험치 통
  isLevelUp?: boolean;  
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 550; 
const MODAL_WIDTH = Math.min(SCREEN_WIDTH * 0.95, 950); 
const MODAL_HEIGHT = MODAL_WIDTH * 0.75; 
const SCALE = MODAL_WIDTH / BASE_WIDTH;

const normalize = (size: number) => Math.round(size * SCALE);

export default function ClassResultModal({ 
  visible, 
  onClose, 
  focusRate = 0,    
  currentXP = 0,   
  maxXP = 100,     
  isLevelUp = false 
}: ClassResultModalProps) {

  const today = new Date();
  const dateString = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  // 분모가 0이 되는 것을 방지
  const safeMaxXP = maxXP === 0 ? 100 : maxXP;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ImageBackground
          source={require('../../assets/result_background.png')} 
          style={[styles.modalBackground, { width: MODAL_WIDTH, height: MODAL_HEIGHT }]}
          resizeMode="stretch" 
        >
          <View style={styles.contentContainer}>
            
            {/* 헤더 */}
            <View style={styles.headerBadge}>
              <Ionicons name="sparkles" size={normalize(14)} color="#FFD700" style={{marginRight: 5}} />
              <Text style={styles.headerText}>경험치를 받았어요!</Text>
              <Ionicons name="sparkles" size={normalize(14)} color="#FFD700" style={{marginLeft: 5}} />
            </View>

            {/* 타이틀 & 날짜 */}
            <View style={styles.topSection}>
                <Text style={styles.title}>오늘의 경험치 통계</Text>
                <Text style={styles.dateText}>☁️ {dateString} ☁️</Text>
            </View>

            {/* 캐릭터 섹션 */}
            <View style={styles.characterContainer}>
               <Image 
                 source={require('../../assets/common_Enter.png')} 
                 style={[styles.characterImage, { transform: [{ rotate: '-10deg' }] }]} 
                 resizeMode="contain" 
               />
               <Image 
                 source={require('../../assets/common_IsTeacher.png')} 
                 style={[styles.characterImage, { width: normalize(90), height: normalize(90), zIndex: 10, marginBottom: normalize(15) }]} 
                 resizeMode="contain" 
               />
               <Image 
                 source={require('../../assets/common_IsStudent.png')} 
                 style={[styles.characterImage, { transform: [{ rotate: '10deg' }] }]} 
                 resizeMode="contain" 
               />
            </View>

            {/* 경험치 섹션 (focusRate, currentXP, maxXP 적용) */}
            <View style={styles.xpSection}>
                <Text style={styles.xpInfoText}>
                    오늘 수업으로 획득한 경험치 <Text style={styles.xpGreen}>+{focusRate}</Text> ⬆
                </Text>
                
                <View style={{ width: '80%' }}>
                    {/* ExpBar 컴포넌트에 계산된 값 전달 */}
                    <ExperienceBar currentXP={currentXP} maxXP={safeMaxXP} />
                </View>
            </View>

            {/* 보상 텍스트 */}
            <View style={styles.rewardTextContainer}>
                <Text style={styles.rewardBigText}>
                  ✨ {focusRate} 경험치 획득 완료! ✨
                </Text>
                <Text style={styles.rewardSmallText}>
                    {isLevelUp ? "🎉 레벨업 달성! 보상을 확인하세요!" : "꾸준히 학습하여 레벨을 올려보세요!"}
                </Text>
            </View>
            
            {/* 확인 버튼 */}
            <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
                <Text style={styles.confirmButtonText}>확인</Text>
            </TouchableOpacity>

            {/* 보물상자 아이콘 */}
            <View style={styles.chestPosition}>
                 <Image 
                    source={require('../../assets/reward.png')} 
                    style={{ width: normalize(160), height: normalize(160) }} 
                    resizeMode="contain" 
                  />
            </View>

          </View>
        </ImageBackground>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center', 
    justifyContent: 'flex-start', 
    paddingTop: normalize(20), 
    paddingBottom: normalize(20),
  },
  headerBadge: {
    position: 'absolute',
    top: -normalize(14), 
    backgroundColor: '#8D6E63', 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalize(18),
    paddingVertical: normalize(6),
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#EFEBE9',
    zIndex: 20,
  },
  headerText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: normalize(15) 
  },
  topSection: {
    alignItems: 'center',
    marginTop: normalize(5), 
    marginBottom: 0,
  },
  title: {
    fontSize: normalize(22), 
    fontWeight: '800', 
    color: '#5D4037',
    marginBottom: normalize(10), 
  },
  dateText: {
    color: '#8D6E63',
    fontSize: normalize(13), 
    fontWeight: '600',
  },
  characterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: normalize(15), 
    marginBottom: normalize(10),
  },
  characterImage: { 
    width: normalize(75), 
    height: normalize(75),
    marginHorizontal: -5, 
  },
  xpSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: normalize(15), 
  },
  xpInfoText: {
    fontSize: normalize(15), 
    color: '#6D4C41',
    fontWeight: 'bold',
    marginBottom: normalize(5),
  },
  xpGreen: {
    color: '#558B2F', 
    fontSize: normalize(17),
    fontWeight: '900',
  },
  rewardTextContainer: {
    alignItems: 'center',
    marginBottom: normalize(10), 
  },
  rewardBigText: {
    fontSize: normalize(18),
    fontWeight: 'bold',
    color: '#5D4037',
    marginBottom: normalize(3),
  },
  rewardSmallText: {
    fontSize: normalize(12),
    color: '#8D6E63',
  },
  confirmButton: {
    backgroundColor: '#5C9DFF',
    paddingVertical: normalize(12), 
    width: normalize(150), 
    borderRadius: 30,
    borderBottomWidth: 4,
    borderBottomColor: '#3669C9',
    alignItems: 'center',
    zIndex: 20,
    marginTop: 0,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: normalize(17),
  },
  chestPosition: {
    position: 'absolute',
    bottom: normalize(35),
    left: normalize(45),   
    zIndex: 10,
    transform: [{ rotate: '-5deg' }] 
  }
});