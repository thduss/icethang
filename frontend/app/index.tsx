import React, { useEffect } from 'react';
import { Pressable, ImageBackground, StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import "../global.css"; 

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      // ✅ 주소 변경! (폴더 구조에 맞게 수정)
      router.replace('/screens/select'); 
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable style={{ flex: 1 }} onPress={() => router.replace('/screens/select')}>
      <ImageBackground 
        source={require('../assets/welcome.png')} 
        style={styles.background}
        resizeMode="cover"
      >
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  contentContainer: { alignItems: 'center', padding: 20 },
  title: { fontSize: 80, fontWeight: '800', color: 'white', marginBottom: 20, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 2, height: 2}, textShadowRadius: 5 },
  subtitle: { fontSize: 24, fontWeight: 'bold', color: 'white', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 3 }
});