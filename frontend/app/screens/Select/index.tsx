import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
// [추가된 Import]
import * as SecureStore from 'expo-secure-store';
import { useDispatch } from 'react-redux';
import { restoreAuth } from '../../store/slices/authSlice'; // 경로 확인 필요

const { width } = Dimensions.get('window');

const MAX_CARD_WIDTH = 500;
const CONTAINER_PADDING = 20;
const CARD_GAP = 20;

let cardWidth = (width - (CONTAINER_PADDING * 2) - CARD_GAP) / 2;
cardWidth = Math.min(cardWidth, MAX_CARD_WIDTH);

const cardHeight = cardWidth * 1.25;
const scale = cardWidth / 320;

export default function SelectRoleScreen() {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleTeacherStart = async () => {
    try {
      if (Platform.OS !== 'web') {
        // 저장된 토큰 확인
        const accessToken = await SecureStore.getItemAsync('accessToken');
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const userRole = await SecureStore.getItemAsync('userRole');

        // 자동 로그인 조건: 토큰 O + 역할 선생님
        if (accessToken && refreshToken && userRole === 'teacher') {
          console.log("🔄 자동 로그인: 저장된 교사 세션 확인됨");
          
          dispatch(restoreAuth({ 
            accessToken: accessToken, 
            userRole: 'teacher' 
          }));

          // 메인 페이지로 바로 이동
          router.replace('/screens/Teacher_MainPage');
          return;
        }
      }
    } catch (e) {
      console.log("세션 확인 중 오류 (로그인 화면으로 이동):", e);
    }

    // 조건 불만족 -> 로그인 화면으로 이동
    router.push('/screens/Teacher_Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        
        {/* 선생님 카드 */}
        <View style={[styles.cardContainer, { width: cardWidth, height: cardHeight }]}>
          <Image
            source={require('../../../assets/card_background.png')}
            style={styles.cardBackground}
            resizeMode="stretch"
          />
          <View style={styles.characterArea}>
            <Image
              source={require('../../../assets/common_IsTeacher.png')}
              style={styles.characterImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.textArea}>
            <Text style={[styles.mainTextOutline, { fontSize: 26 * scale }]}>선생님이에요!</Text>
            <Text style={[styles.mainText, { fontSize: 26 * scale }]}>선생님이에요!</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.button, { borderRadius: 25 * scale }]}
            onPress={handleTeacherStart}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { fontSize: 16 * scale }]}>선생님으로 시작하기</Text>
          </TouchableOpacity>
        </View>

        {/* 학생 카드 */}
        <View style={[styles.cardContainer, { width: cardWidth, height: cardHeight }]}>
          <Image
            source={require('../../../assets/card_background.png')}
            style={styles.cardBackground}
            resizeMode="stretch"
          />
          <View style={styles.characterArea}>
            <Image
              source={require('../../../assets/common_IsStudent.png')}
              style={styles.characterImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.textArea}>
            <Text style={[styles.mainTextOutline, { fontSize: 26 * scale }]}>학생이에요!</Text>
            <Text style={[styles.mainText, { fontSize: 26 * scale }]}>학생이에요!</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.button, { borderRadius: 25 * scale }]}
            onPress={() => router.push('/screens/Student_Login')}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { fontSize: 16 * scale }]}>학생으로 시작하기</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E9DD',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: CONTAINER_PADDING,
  },
  row: {
    flexDirection: 'row',
    gap: CARD_GAP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 배경 이미지
  cardBackground: {
    position: 'absolute',
    width: '150%',
    height: '100%',
    top: 0,
    left: '-25%', 
    borderRadius: 30,
  },
  // 캐릭터 영역
  characterArea: {
    position: 'absolute',
    top: '18%', 
    width: '100%',
    height: '45%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  characterImage: {
    width: '80%',
    height: '80%',
  },
  // 텍스트 영역 
  textArea: {
    position: 'absolute',
    bottom: '30%',
    width: '100%',
    alignItems: 'center',
    zIndex: 2,
  },
  mainText: {
    fontWeight: '900',
    color: '#C0E9FD',
    position: 'absolute',
  },
  mainTextOutline: {
    fontWeight: '900',
    color: 'transparent',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 3,
  },
  // 버튼 영역 
  button: {
    position: 'absolute',
    bottom: '18%', 
    width: '80%',
    height: '10%', 
    backgroundColor: '#7CB3F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    borderBottomWidth: 4,
    borderBottomColor: '#7DABE7',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});