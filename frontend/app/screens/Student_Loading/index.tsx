import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing, useWindowDimensions, ImageBackground } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router'; // 🚀 추가
import { stompClient } from '../../utils/socket'; // 🚀 공통 소켓 클라이언트 가져오기

const CONFIG = {
  colors: {
    textTitle: '#5D4037',  
    textSubtitle: '#7986CB', 
  },
};

export default function StudentWaitingScreen() {
  const { width, height } = useWindowDimensions();
  const router = useRouter(); // 🚀 추가
  const params = useLocalSearchParams(); // 🚀 classId 등을 받기 위해 추가
  
  // classId가 params에 없다면 기본값 설정 (프로젝트 구조에 맞춰 수정하세요)
  const classId = params.classId ? Number(params.classId) : 1;

  // 애니메이션
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // 🚀 [추가] 실시간 수업 시작 감시 로직
  useEffect(() => {
    if (!stompClient || !stompClient.connected) {
      console.log("🚨 소켓이 연결되지 않아 수업 시작을 감지할 수 없습니다.");
      return;
    }

    console.log(`📡 [대기실] 반 ${classId} 수업 시작 대기 중...`);

    // 교사의 모드 변경을 구독합니다.
    const modeSub = stompClient.subscribe(`/topic/class/${classId}/mode`, (msg) => {
      const body = JSON.parse(msg.body);
      console.log("🔄 수신된 모드:", body.mode);

      if (body.mode === 'DIGITAL') {
        console.log("🚀 선생님이 디지털 수업을 시작했습니다!");
        
        // 1. 디지털 수업 페이지로 자동 이동
        // 실제 경로명(app 폴더 구조)에 맞춰 수정하세요.
        router.replace({
          pathname: '/screens/DigitalClassScreen',
          params: { classId: classId }
        });
      }
    });

    return () => {
      // 대기실을 떠날 때 구독 해제
      modeSub.unsubscribe();
    };
  }, [stompClient.connected, classId]);

  // 기존 둥둥 떠다니는 애니메이션 로직
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
      <View style={[styles.textContainer, { marginBottom: height * 0.05 }]}>
        <Text style={[styles.titleText, { fontSize: titleSize }]}>
          ⭐ 조금만 기다려 주세요! ⭐
        </Text>
        <Text style={[styles.subtitleText, { fontSize: subtitleSize }]}>
          선생님이 곧 오실 거에요!
        </Text>
      </View>

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
  backgroundImage: { flex: 1, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  textContainer: { alignItems: 'center' },
  titleText: { fontWeight: '900', color: CONFIG.colors.textTitle, marginBottom: 15, textAlign: 'center', textShadowColor: 'rgba(255, 255, 255, 0.6)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 3 },
  subtitleText: { fontWeight: 'bold', color: CONFIG.colors.textSubtitle, textAlign: 'center', textShadowColor: 'rgba(255, 255, 255, 0.6)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  centerImageContainer: { alignItems: 'center', justifyContent: 'center' },
});