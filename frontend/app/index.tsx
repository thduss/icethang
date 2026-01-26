import React, { useEffect, useRef } from 'react';
import { ImageBackground, StyleSheet, View, Text, ActivityIndicator, Animated, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from './services/auth'; 

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 캐릭터 둥둥 애니메이션 (부드러운 속도)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // 전체 화면 페이드 인
    Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }).start();

    const initializeApp = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 3500));
        let session = null;
        try {
          session = await AuthService.checkSession();
        } catch (e) {
          console.log("세션 체크 실패:", e);
        }

        if (session && session.isLoggedIn) {
          if (session.role === 'teacher') router.replace('/screens/Teacher_MainPage');
          else router.replace('/screens/student_home');
        } else {
          router.replace('/screens/select'); 
        }
      } catch (error) {
        router.replace('/screens/select');
      }
    };

    initializeApp();
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('../assets/welcome.png')} 
        style={styles.background}
        resizeMode="cover"
      >
        <Animated.View style={[styles.innerContainer, { opacity: fadeAnim }]}>
          
          {/* 1. 로고: 화면 가로를 거의 꽉 채우도록 크기 최대화 */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logo} 
              resizeMode="contain" 
            />
          </View>

          {/* 2. 캐릭터: 크기를 더 줄이고 하단 풀밭 깊숙이 배치 */}
          <View style={styles.characterWrapper}>
            <Animated.Image 
              source={require('../assets/common_Enter.png')} 
              style={[styles.character, { transform: [{ translateY }] }]} 
              resizeMode="contain" 
            />
            <Animated.Image 
              source={require('../assets/common_IsTeacher.png')} 
              style={[styles.character, { transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [-4, -15] }) }] }]} 
              resizeMode="contain" 
            />
            <Animated.Image 
              source={require('../assets/common_IsStudent.png')} 
              style={[styles.character, { transform: [{ translateY }] }]} 
              resizeMode="contain" 
            />
          </View>

          {/* 3. 로딩바: 캐릭터 방해 안 되게 최하단으로 이동 */}
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#FF8A65" />
            <Text style={styles.loadingText}>즐거운 얼음땡 준비 중...</Text>
          </View>

        </Animated.View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { width: '100%', height: '100%' },
  innerContainer: { flex: 1, alignItems: 'center' },
  
  logoContainer: {
    marginTop: height * 0.2, 
    width: width * 1.5,      
    height: height * 0.4,    
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },

  characterWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: '100%',
    position: 'absolute',
    bottom: height * 0.18,     
    gap: -30,               
  },
  character: {
    width: width * 0.13,      
    height: width * 0.13,
  },

  loadingBox: { 
    position: 'absolute', 
    bottom: height * 0.05,   
    alignItems: 'center'
  },
  loadingText: { 
    marginTop: 8, 
    color: '#555', 
    fontWeight: 'bold', 
    fontSize: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 10,
    borderRadius: 10
  }
});