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
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }).start();

    const initializeApp = async () => {
        await new Promise(resolve => setTimeout(resolve, 3500));
        const session = await AuthService.checkSession().catch(err => {
          console.log("세션 체크 실패 (로그인 화면으로 이동):", err);
          return null; 
        });

        // 3. 결과에 따른 라우팅 (단일 분기)
        // session이 null이거나(에러 포함), isLoggedIn이 false면 else로 넘어갑니다.
        if (session?.isLoggedIn) {
          const targetRoute = session.role === 'teacher' 
            ? '/screens/Teacher_MainPage' 
            : '/screens/Student_Home';
          router.replace(targetRoute);
        } else {
          // 세션 없음, 에러 발생, 로그인 안 됨 -> 모두 선택 화면으로
          router.replace('/screens/Select');
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
          
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logo} 
              resizeMode="contain" 
            />
          </View>

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