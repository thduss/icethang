import React, { useEffect } from 'react';
import { ImageBackground, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from './services/auth';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const initializeApp = async () => {
      // 1. 최소 2초간 얼음땡 로고 보여주기
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000));
      const sessionCheck = AuthService.checkSession();

      // 2. 로딩과 데이터 확인을 동시에 진행
      const [_, session] = await Promise.all([minLoadingTime, sessionCheck]);

      // 3. 상태에 따라 이동
      if (session && session.isLoggedIn) {
        if (session.role === 'teacher') router.replace('/screens/teacher_home');
        else router.replace('/screens/student_home');
      } else {
        router.replace('/screens/select'); // 로그인 안 되어 있으면 선택 화면으로
      }
    };

    initializeApp();
  }, []);

  return (
    <ImageBackground 
      source={require('../assets/welcome.png')} //  배경 이미지
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>로딩중...</Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  logoText: { fontSize: 60, fontWeight: '900', color: '#FF6B6B', marginBottom: 200, textShadowColor: 'white', textShadowRadius: 10 },
  loadingBox: { position: 'absolute', bottom: 100, alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#555', fontWeight: 'bold' }
});