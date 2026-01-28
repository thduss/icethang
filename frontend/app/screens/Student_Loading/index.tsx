import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing, useWindowDimensions, ImageBackground } from 'react-native';

const CONFIG = {
  colors: {
    textTitle: '#5D4037',  
    textSubtitle: '#7986CB', 
  },
};

export default function StudentWaitingScreen() {
  const { width, height } = useWindowDimensions();
  
  // 애니메이션
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -20, 
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0, 
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [bounceAnim]);

  const imageSize = Math.min(width * 0.6, 500); 
  
  const titleSize = Math.min(width * 0.1, 60);  
  const subtitleSize = Math.min(width * 0.05, 30);

  return (
    <ImageBackground
      source={require('../../../assets/loading_background.png')}
      style={styles.backgroundImage}
      resizeMode="cover" 
    >
      
      {/* 1. 텍스트 영역 */}
      <View style={[styles.textContainer, { marginBottom: height * 0.05 }]}>
        <Text style={[styles.titleText, { fontSize: titleSize }]}>
          ⭐ 조금만 기다려 주세요! ⭐
        </Text>
        <Text style={[styles.subtitleText, { fontSize: subtitleSize }]}>
          선생님이 곧 오실 거에요!
        </Text>
      </View>

      {/* 2. 중앙 문 이미지 */}
      <Animated.View 
        style={[
          styles.centerImageContainer, 
          { transform: [{ translateY: bounceAnim }] } 
        ]}
      >
        <Image
          source={require('../../../assets/door.png')} 
          style={{ width: imageSize, height: imageSize }}
          resizeMode="contain"
        />
      </Animated.View>

    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',    
    justifyContent: 'center', 
  },
  textContainer: {
    alignItems: 'center',
  },
  titleText: {
    fontWeight: '900',
    color: CONFIG.colors.textTitle,
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.6)', 
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  subtitleText: {
    fontWeight: 'bold',
    color: CONFIG.colors.textSubtitle,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  centerImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});