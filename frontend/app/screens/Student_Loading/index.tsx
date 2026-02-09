import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing, useWindowDimensions, ImageBackground } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/stores';
import { stompClient, connectSocket } from '../../utils/socket';
import * as SecureStore from 'expo-secure-store';

export default function StudentWaitingScreen() {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const params = useLocalSearchParams();
  const studentData = useSelector((state: RootState) => state.auth.studentData);
  const classId = params.classId ? String(params.classId) : studentData?.classId?.toString() || "1";
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const reduxToken = useSelector((state: RootState) => state.auth?.accessToken);

  useEffect(() => {
    console.log('[Loading] useEffect 시작 - classId:', classId, 'active:', stompClient.active, 'connected:', stompClient.connected);

    const setupSubscription = () => {
      const targetPath = `/topic/class/${classId}/mode`;
      console.log('[Loading] 구독 시작:', targetPath);
      return stompClient.subscribe(targetPath, (msg) => {
        console.log('[Loading] 모드 메시지 수신 RAW:', msg.body);
        try {
          const body = JSON.parse(msg.body);
          console.log('[Loading] 파싱된 mode:', body.mode);

          if (body.mode === 'DIGITAL') {
            console.log('[Loading] DIGITAL 모드 -> Classtime_Digital로 이동');
            router.replace(`/screens/Classtime_Digital?classId=${classId}`);
          } else if (body.mode === 'NORMAL') {
            console.log('[Loading] NORMAL 모드 -> Classtime_Normal로 이동');
            router.replace(`/screens/Classtime_Normal?classId=${classId}`);
          } else {
            console.log('[Loading] 알 수 없는 mode:', body.mode);
          }
        } catch (e) {
          console.error('[Loading] 메시지 파싱 에러:', e);
        }
      });
    };

    let modeSub: any = null;

    const initSocket = async () => {
      // 토큰 확보 (Redux -> SecureStore)
      let token = reduxToken;
      if (!token) {
        token = await SecureStore.getItemAsync('accessToken');
      }
      console.log('[Loading] 토큰:', token ? '있음' : '없음');

      // 인증 포함 연결
      connectSocket(token || "");

      if (stompClient.connected) {
        console.log('[Loading] 이미 연결됨 -> 즉시 구독');
        modeSub = setupSubscription();
      } else {
        console.log('[Loading] 미연결 -> onConnect 콜백 설정');
        stompClient.onConnect = () => {
          console.log('[Loading] onConnect 콜백 실행됨!');
          modeSub = setupSubscription();
        };
      }
    };

    initSocket();

    return () => {
      console.log('[Loading] useEffect cleanup - unsubscribe');
      if (modeSub) modeSub.unsubscribe();
    };
  }, [classId, reduxToken]);

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