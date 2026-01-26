import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing, useWindowDimensions } from 'react-native';

// 🎨 디자인 설정 (이전 화면들과 통일)
const CONFIG = {
  colors: {
    background: '#FFFDF5', // 크림색 배경
    textTitle: '#5D4037',  // 따뜻한 갈색 텍스트
    textSubtitle: '#7986CB', // 부드러운 파란색 (선생님이 곧 오실 거에요)
  },
};

export default function StudentWaitingScreen() {
  const { width } = useWindowDimensions();
  
  // 🎈 애니메이션을 위한 값 (0에서 시작)
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // 🔄 위아래 둥실둥실 애니메이션 설정
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -15, // 위로 15px 이동
          duration: 1500, // 1.5초 동안
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0, // 다시 원위치
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [bounceAnim]);

  // 이미지 크기 반응형 계산
  const imageSize = Math.min(width * 0.5, 250);

  return (
    <View style={styles.container}>
      
      {/* 1. 텍스트 영역 */}
      <View style={styles.textContainer}>
        <Text style={styles.titleText}>
          ⭐ 조금만 기다려 주세요! ⭐
        </Text>
        <Text style={styles.subtitleText}>
          선생님이 곧 오실 거에요!
        </Text>
      </View>

      {/* 2. 중앙 이미지 (애니메이션 적용) */}
      <Animated.View 
        style={[
          styles.imageContainer, 
          { transform: [{ translateY: bounceAnim }] } // 위아래 움직임 적용
        ]}
      >
        {/* ⚠️ [중요] 여기에 보여주신 '문' 이미지나 '로봇' 이미지를 넣어주세요.
          지금은 예시로 로봇 이미지를 사용했습니다. 
          assets 폴더에 이미지가 있다면 require('../../assets/door.png') 등으로 바꾸세요.
        */}
        <Image
          // 예시 이미지 (로봇) - 문 이미지가 있다면 그것으로 교체하세요!
          source={require('../../../assets/robot.png')} 
          style={{ width: imageSize, height: imageSize }}
          resizeMode="contain"
        />
        
        {/* ✨ 바닥 그림자 (살짝 입체감) */}
        <View style={[styles.shadow, { width: imageSize * 0.6 }]} />
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONFIG.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40, // 이미지와 간격
  },
  titleText: {
    fontSize: 28,
    fontWeight: '900',
    color: CONFIG.colors.textTitle,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.colors.textSubtitle,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    height: 15,
    backgroundColor: 'rgba(0,0,0,0.1)', // 연한 그림자
    borderRadius: 50, // 타원형
    marginTop: 10,
    transform: [{ scaleX: 1.5 }] // 옆으로 길쭉하게
  }
});