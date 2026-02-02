import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing, useWindowDimensions, ImageBackground } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router'; 
import { stompClient } from '../../utils/socket'; 
import { SOCKET_CONFIG } from '../../api/socket'; 

export default function StudentWaitingScreen() {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const params = useLocalSearchParams();
  const classId = params.classId ? String(params.classId) : "1";
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!stompClient.active) stompClient.activate();

    const setupSubscription = () => {
      const targetPath = `/topic/class/${classId}/mode`;
      return stompClient.subscribe(targetPath, (msg) => {
        const body = JSON.parse(msg.body);
        console.log("📥 메시지 수신:", body.mode);

        // ✅ [수정] 이동 경로를 단순 문자열로도 시도 (가장 확실한 방법)
        if (body.mode === 'DIGITAL') {
          router.replace(`/screens/Classtime_Digital?classId=${classId}`);
        } else if (body.mode === 'NORMAL') {
          router.replace(`/screens/Classtime_Normal?classId=${classId}`);
        }
      });
    };

    let modeSub: any = null;
    if (stompClient.connected) {
      modeSub = setupSubscription();
    } else {
      stompClient.onConnect = () => { modeSub = setupSubscription(); };
    }

    return () => { if (modeSub) modeSub.unsubscribe(); };
  }, [classId]);

  // 애니메이션 로직 (생략 - 기존과 동일)
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(bounceAnim, { toValue: -20, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    ])).start();
  }, [bounceAnim]);

  return (
    <ImageBackground source={require('../../../assets/loading_background.png')} style={styles.backgroundImage} resizeMode="cover">
      <View style={styles.textContainer}>
        <Text style={styles.titleText}>⭐ 조금만 기다려 주세요! ⭐</Text>
        <Text style={styles.subtitleText}>선생님이 곧 수업을 시작하실 거에요!</Text>
      </View>
      <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
        <Image source={require('../../../assets/door.png')} style={{ width: width * 0.6, height: width * 0.6 }} resizeMode="contain" />
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  textContainer: { alignItems: 'center', marginBottom: 50 },
  titleText: { fontSize: 24, fontWeight: '900', color: '#5D4037', marginBottom: 15 },
  subtitleText: { fontSize: 16, fontWeight: 'bold', color: '#7986CB' },
});