import { ThemeProvider } from './context/ThemeContext';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { View } from 'react-native';
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  useEffect(() => {
    const timer = setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="screens/select/index" />
        <Stack.Screen name="screens/teacher_login/index" />
        <Stack.Screen name="screens/student_login/index" />
        <Stack.Screen name="screens/Teacher_MainPage/TeacherMainPage" />

      </Stack>
    </ThemeProvider>
  );
}