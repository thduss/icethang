import React from 'react';
import { View, Text, Pressable, StyleSheet, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import "../../../global.css"; 

export default function RoleSelectScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.cardsContainer}>
        
        {/* 🐿️ 선생님 카드 */}
        <View style={styles.cardWrapper}>
          <View style={styles.cloudCard}>
            <Image 
              source={require('../../../assets/squirrel.png')} 
              style={styles.characterImage}
              resizeMode="contain"
            />
            <Text style={styles.roleTitle}>선생님이에요!</Text>
            
            <Pressable 
              style={({ pressed }) => [
                styles.startButton,
                pressed && styles.buttonPressed 
              ]}
              onPress={() => router.push('/screens/login')}
            >
              <Text style={styles.buttonText}>선생님으로 시작하기</Text>
            </Pressable>
          </View>
        </View>

        {/* 🌱 학생 카드 */}
        <View style={styles.cardWrapper}>
          <View style={styles.cloudCard}>
            <Image 
              source={require('../../../assets/sprout.png')} 
              style={styles.characterImage}
              resizeMode="contain"
            />
            <Text style={styles.roleTitle}>학생이에요!</Text>
            
            <Pressable 
              style={({ pressed }) => [
                styles.startButton,
                pressed && styles.buttonPressed
              ]}
              onPress={() => router.push('/screens/signup')}
            >
              <Text style={styles.buttonText}>학생으로 시작하기</Text>
            </Pressable>
          </View>
        </View>

      </View>
    </View>
  );
}

// 🎨 스타일 대폭 수정 (화면 꽉 채우기 버전)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4EAE0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 80, // 👈 카드 사이 간격을 넓혀서 화면을 더 넓게 쓰도록 수정!
    alignItems: 'center',
  },
  cardWrapper: {
    ...Platform.select({
      ios: {
        shadowColor: '#A0C4FF',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  cloudCard: {
    backgroundColor: 'white',
    // 👇 크기를 대폭 키웠습니다!
    width: 320,  
    height: 450, 
    
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40, // 내부 여백도 늘림
    paddingHorizontal: 20,
    
    // ☁️ 구름 모양 비율 유지하며 크기 증가
    borderTopLeftRadius: 160, 
    borderTopRightRadius: 160,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    
    borderWidth: 5, // 테두리도 약간 두껍게
    borderColor: '#D0E3FF',
  },
  characterImage: {
    // 👇 이미지도 카드 크기에 맞춰 키움
    width: 180, 
    height: 180,
    marginBottom: 10,
  },
  roleTitle: {
    // 👇 글씨 크기 증가
    fontSize: 34, 
    fontWeight: '900',
    color: '#4A5568',
    letterSpacing: -1,
  },
  startButton: {
    backgroundColor: '#8AB4F8',
    paddingVertical: 18, // 버튼도 더 통통하게
    paddingHorizontal: 24,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    
    borderWidth: 2,
    borderColor: '#A0C4FF',
    borderBottomWidth: 5, // 입체감 UP
  },
  buttonPressed: {
    backgroundColor: '#6A94D8',
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20, // 버튼 글씨도 키움
  },
});