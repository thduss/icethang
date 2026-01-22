import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';

// 스플래시 화면 제어
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  useEffect(() => {
    // 앱이 켜지고 0.5초 뒤에 스플래시 화면 숨기기 (안전장치)
    const timer = setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    // 🚨 중요: 여기에 <View>나 <TeacherLoginScreen />을 직접 넣으면 안 됩니다!
    // 무조건 <Stack>이 가장 바깥에 있어야 'Navigation Context' 에러가 안 납니다.
    <Stack screenOptions={{ headerShown: false }}>
      
      {/* 1. 메인 화면 (index.tsx) */}
      <Stack.Screen name="index" />

      {/* 2. 선택 화면 */}
      <Stack.Screen name="screens/select/index" />

      {/* 3. 교사 로그인 화면 */}
      <Stack.Screen name="screens/teacher_login/index" />

      {/* 4. 학생 로그인 화면 (만약 있다면) */}
      <Stack.Screen name="screens/student_login/index" />

      <Stack.Screen name="screens/Teacher_MainPage/TeacherMainPage" />
      
    </Stack>
  );
}