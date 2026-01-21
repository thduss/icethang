import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 테마 종류들 (추가 가능)
export const themes = {
  blue: {
    background: '#000000',
    primary: '#4A90E2',
    text: '#ffffff',
    card: '#1A1A1A'
  },
  pink: {
    background: '#FFF0F5',
    primary: '#FF69B4',
    text: '#4B0082',
    card: '#FFFFFF'
  },
// 1. 정글 (Jungle): 햇살 비치는 밝은 숲 (Light Green Mode)
  jungle: {
    background: '#F1F9F5', // 아주 연한 민트/화이트 배경
    primary: '#27AE60',    // 선명한 나뭇잎 초록색
    text: '#1B4D3E',       // 짙은 쑥색 (가독성 확보)
    card: '#FFFFFF'        // 깨끗한 화이트 카드
  },
  // 2. 연보라색 우주 (Universe): 환상적인 은하수 (Pastel Nebula Mode)
  universe: {
    background: '#F3F0FF', // 연한 라벤더 배경
    primary: '#845EF7',    // 톡톡 튀는 보라색
    text: '#2B134B',       // 깊은 보라색 텍스트
    card: '#EBE4FF'        // 은은한 보랏빛 카드
  },
  // 3. 회색빛 도시 (City): 세련된 무채색과 세리안 블루 포인트
  city: {
    background: '#121212', // 다크 모드 기반의 블랙
    primary: '#8E8E93',    // 도회적인 메탈릭 그레이
    text: '#E5E5EA',       // 밝은 회색 텍스트
    card: '#2C2C2E'        // 아스팔트 느낌의 진회색
  },
  // 4. 맑은 바다 (Sea): 청량한 민트색과 깊은 바다의 시원함
  sea: {
    background: '#E0F7FA', // 아주 연한 물빛 배경
    primary: '#00ACC1',    // 선명한 청록색 (터쿼이즈)
    text: '#006064',       // 깊은 바닷속 느낌의 다크 블루
    card: '#FFFFFF'        // 파도 거품 같은 순백색
  }
};

type ThemeType = keyof typeof themes;

const ThemeContext = createContext({
  theme: themes.blue,
  setTheme: (name: ThemeType) => {},
  currentThemeName: 'blue' as ThemeType,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('blue');
  const [isLoading, setIsLoading] = useState(true);

  // 앱 시작 시 저장된 테마 불러오기
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('currentTheme');
        if (savedTheme && savedTheme in themes) {
          setCurrentTheme(savedTheme as ThemeType);
        }
      } catch (error) {
        console.error('테마 불러오기 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // 테마 변경 및 저장
  const handleSetTheme = async (name: ThemeType) => {
    try {
      setCurrentTheme(name);
      await AsyncStorage.setItem('currentTheme', name);
    } catch (error) {
      console.error('테마 저장 실패:', error);
    }
  };

  if (isLoading) {
    return null; // 또는 로딩 화면을 보여줄 수 있음
  }

  return (
    <ThemeContext.Provider value={{ theme: themes[currentTheme], setTheme: handleSetTheme, currentThemeName: currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);