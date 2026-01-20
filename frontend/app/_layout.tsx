import { Stack } from "expo-router";
import "../global.css"; 
import { ThemeProvider } from './context/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack 
        screenOptions={{
          headerShown: false, // 헤더 사용X 
          animation: 'slide_from_right', // 슬라이드 효과 O
        }} 
      />
    </ThemeProvider>
  );
}