import { Slot } from 'expo-router';  
import { ThemeProvider } from './context/ThemeContext';
import "../global.css"; // 여기서 스타일 불러오기

export default function Layout() {
  // Slot은 "자식 화면(index.tsx 등)을 여기에 보여줘!" 라는 뜻입니다.
  return (
      <ThemeProvider> 
        {/* 여기에 Stack 또는 나머지 컴포넌트들이 위치해야 합니다 */}
        <Slot /> 
      </ThemeProvider>
  );
}