import React, { createContext, useState, useContext } from 'react';

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
  // 필요한 만큼 추가...
};

type ThemeType = keyof typeof themes;

const ThemeContext = createContext({
  theme: themes.blue,
  setTheme: (name: ThemeType) => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('blue');

  return (
    <ThemeContext.Provider value={{ theme: themes[currentTheme], setTheme: setCurrentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);