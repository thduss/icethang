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
// 1. 정글
  jungle: {
    background: '#F1F9F5',
    primary: '#27AE60',    
    text: '#1B4D3E',       
    card: '#FFFFFF'       
  },
  // 2. 연보라 우주 
  universe: {
    background: '#F3F0FF', 
    primary: '#845EF7',    
    text: '#2B134B',      
    card: '#EBE4FF'    
  },
  // 3. 회색 도시
  city: {
    background: '#121212', 
    primary: '#8E8E93',    
    text: '#E5E5EA',       
    card: '#2C2C2E'        
  },
  // 4. 맑은 바다
  sea: {
    background: '#E0F7FA',
    primary: '#00ACC1',    
    text: '#006064',       
    card: '#FFFFFF'        
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

  const handleSetTheme = async (name: ThemeType) => {
    try {
      setCurrentTheme(name);
      await AsyncStorage.setItem('currentTheme', name);
    } catch (error) {
      console.error('테마 저장 실패:', error);
    }
  };

  if (isLoading) {
    return null; 
  }

  return (
    <ThemeContext.Provider value={{ theme: themes[currentTheme], setTheme: handleSetTheme, currentThemeName: currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);