import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing, useWindowDimensions, ImageBackground } from 'react-native';

// 폰트 색상 설정 
const CONFIG = {
  colors: {
    textTitle: '#5D4037',  
    textSubtitle: '#7986CB', 
  },
};

export default function StudentWaitingScreen() {
  const { width } = useWindowDimensions();
  
  // 둥실둥실 애니메이션 값
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -15,
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

  const imageSize = Math.min(width * 0.5, 250);

  return (
    <ImageBackground
      source={require('../../../assets/loading_background.png')}
      resizeMode="cover" 
    >
      
      {/* 1. 텍스트 영역 */}
      <View style={styles.textContainer}>
        <Text style={styles.titleText}>
          ⭐ 조금만 기다려 주세요! ⭐
        </Text>
        <Text style={styles.subtitleText}>
          선생님이 곧 오실 거에요!
        </Text>
      </View>

      {/* 2. 중앙 문(또는 로봇) 이미지 (애니메이션 적용) */}
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
  // 배경 이미지 스타일
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center', 
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '900',
    color: CONFIG.colors.textTitle,
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.colors.textSubtitle,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  centerImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});