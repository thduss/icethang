import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Image, ImageBackground, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ExperienceBar from './ExpBar'; 

interface ClassResultModalProps {
  visible: boolean;
  onClose: () => void;
  gainedXP?: number;   
  currentXP?: number;   
  maxXP?: number;       
  isLevelUp?: boolean;  
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 550); 
const MODAL_HEIGHT = MODAL_WIDTH * 0.75; 

export default function ClassResultModal({ 
  visible, 
  onClose, 
  gainedXP = 0,    
  currentXP = 0,   
  maxXP = 100,     
  isLevelUp = false 
}: ClassResultModalProps) {

  const today = new Date();
  const dateString = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

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
              <Ionicons name="sparkles" size={14} color="#FFD700" style={{marginRight: 5}} />
              <Text style={styles.headerText}>경험치를 받았어요!</Text>
              <Ionicons name="sparkles" size={14} color="#FFD700" style={{marginLeft: 5}} />
            </View>

            {/* 타이틀 & 날짜  */}
            <View style={styles.topSection}>
                <Text style={styles.title}>오늘의 경험치 통계</Text>
                <Text style={styles.dateText}>☁️ {dateString} ☁️</Text>
            </View>

            {/* 캐릭터  */}
            <View style={styles.characterContainer}>
               <Image 
                 source={require('../../assets/common_Enter.png')} 
                 style={[styles.characterImage, { transform: [{ rotate: '-10deg' }] }]} 
                 resizeMode="contain" 
               />
               <Image 
                 source={require('../../assets/common_IsTeacher.png')} 
                 style={[styles.characterImage, { width: 90, height: 90, zIndex: 10, marginBottom: 15 }]} 
                 resizeMode="contain" 
               />
               <Image 
                 source={require('../../assets/common_IsStudent.png')} 
                 style={[styles.characterImage, { transform: [{ rotate: '10deg' }] }]} 
                 resizeMode="contain" 
               />
            </View>

            {/* 경험치 섹션 */}
            <View style={styles.xpSection}>
                <Text style={styles.xpInfoText}>
                    오늘 수업으로 획득한 경험치 <Text style={styles.xpGreen}>+{gainedXP}</Text> ⬆
                </Text>
                
                <View style={{ width: '80%' }}>
                    <ExperienceBar currentXP={currentXP} maxXP={safeMaxXP} />
                </View>
            </View>

            {/* 보상 텍스트  */}
            <View style={styles.rewardTextContainer}>
                <Text style={styles.rewardBigText}>
                  ✨ {gainedXP} 경험치 획득 완료! ✨
                </Text>
                <Text style={styles.rewardSmallText}>
                    {isLevelUp ? "🎉 레벨업 달성! " : "꾸준히 학습하여 레벨을 올려보세요!"}
                </Text>
            </View>
            
            {/*확인 버튼 */}
            <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
                <Text style={styles.confirmButtonText}>확인</Text>
            </TouchableOpacity>

            {/* 보물상자 */}
            <View style={styles.chestPosition}>
                <Image 
                   source={require('../../assets/reward.png')} 
                   style={{ width: 160, height: 160 }} 
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
    paddingTop: 20, 
    paddingBottom: 20,
  },
  
  // 헤더
  headerBadge: {
    position: 'absolute',
    top: -14, 
    backgroundColor: '#8D6E63', 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#EFEBE9',
    zIndex: 20,
  },
  headerText: { color: 'white', fontWeight: 'bold', fontSize: 15 },

  // 상단 타이틀 섹션
  topSection: {
    alignItems: 'center',
    marginTop: 5, 
    marginBottom: 0,
  },
  title: {
    fontSize: 22, 
    fontWeight: '800', 
    color: '#5D4037',
    marginBottom: 8, 
  },
  dateText: {
    color: '#8D6E63',
    fontSize: 13,
    fontWeight: '600',
  },

  // 캐릭터
  characterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: 15, 
    marginBottom: 5,
  },
  characterImage: {
    width: 75,
    height: 75,
    marginHorizontal: -5, 
  },

  // 경험치 바 섹션
  xpSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10, 
  },
  xpInfoText: {
    fontSize: 15,
    color: '#6D4C41',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  xpGreen: {
    color: '#558B2F', 
    fontSize: 17,
    fontWeight: '900',
  },

  // 보상 텍스트
  rewardTextContainer: {
    alignItems: 'center',
    marginBottom: 5, 
  },
  rewardBigText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5D4037',
    marginBottom: 2,
  },
  rewardSmallText: {
    fontSize: 12,
    color: '#8D6E63',
  },

  // 버튼
  confirmButton: {
    backgroundColor: '#5C9DFF',
    paddingVertical: 10,
    width: 140, 
    borderRadius: 25,
    borderBottomWidth: 4,
    borderBottomColor: '#3669C9',
    alignItems: 'center',
    zIndex: 20,
    marginTop: 0,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  chestPosition: {
    position: 'absolute',
    bottom: 30,
    left: 40,   
    zIndex: 10,
    transform: [{ rotate: '-5deg' }] 
  }
});