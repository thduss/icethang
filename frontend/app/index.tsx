import React, { useEffect } from 'react';
import { ImageBackground, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from './services/auth'; 

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. 최소 2초간 로딩 (이건 유지)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 2. 세션 체크 시도 (에러나면 catch로 넘어감)
        let session = null;
        try {
           session = await AuthService.checkSession();
        } catch (e) {
           console.log("세션 체크 실패 (무시하고 진행):", e);
        }

        // 3. 상태에 따라 이동
        if (session && session.isLoggedIn) {
          if (session.role === 'teacher') router.replace('/screens/Teacher_MainPage/TeacherMainPage');
          else router.replace('/screens/student_home');
        } else {
          // 세션이 없거나 에러나면 무조건 선택 화면으로!
          router.replace('/screens/select'); 
        }

      } catch (error) {
        // 4. 정말 치명적인 에러가 나도 무조건 선택 화면으로 보냄 (무한로딩 방지)
        console.error("초기화 에러:", error);
        router.replace('/screens/select');
      }
    };

    initializeApp();
  }, []);

  return (
    <ImageBackground 
      source={require('../assets/welcome.png')} 
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
  loadingBox: { position: 'absolute', bottom: 100, alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#555', fontWeight: 'bold' }
});