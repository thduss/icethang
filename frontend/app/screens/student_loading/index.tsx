import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing, useWindowDimensions, ImageBackground } from 'react-native';

// 🎨 폰트 색상 설정 (배경이 바뀌었으니 글자가 잘 보이게 색상 조정이 필요할 수 있습니다)
const CONFIG = {
  colors: {
    textTitle: '#5D4037',  // 진한 갈색
    textSubtitle: '#7986CB', // 연한 파란색
  },
};

export default function StudentWaitingScreen() {
  const { width } = useWindowDimensions();
  
  // 🎈 둥실둥실 애니메이션 값
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -15, // 위로 둥실
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0, // 아래로 둥실
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [bounceAnim]);

  const imageSize = Math.min(width * 0.5, 250);

  return (
    // 🖼️ [핵심 변경] View 대신 ImageBackground 사용
    // 배경 이미지를 전체 화면에 꽉 채웁니다.
    <ImageBackground
      source={require('../../../assets/loading_background.png')} // 👈 배경으로 쓸 이미지 경로를 넣어주세요!
      style={styles.backgroundImage}
      resizeMode="cover" // 화면을 꽉 채우도록 설정 (비율 유지하며 잘림)
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
        {/* 문 이미지나 로봇 이미지를 여기에 넣으세요 */}
        <Image
          source={require('../../../assets/door.png')} 
          style={{ width: imageSize, height: imageSize }}
          resizeMode="contain"
        />
        
        {/* 바닥 그림자 */}
      </Animated.View>

    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // 배경 이미지 스타일
  backgroundImage: {
    flex: 1, // 화면 전체 채우기
    width: '100%',
    height: '100%',
    alignItems: 'center', // 내용물 중앙 정렬
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
    // 배경이 있어서 글자가 잘 안 보일까봐 그림자 추가 (선택사항)
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