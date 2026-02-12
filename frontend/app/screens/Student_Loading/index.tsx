import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
  ImageBackground,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/stores';
import { stompClient, connectSocket } from '../../utils/socket';
import * as SecureStore from 'expo-secure-store';

export default function StudentWaitingScreen() {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const params = useLocalSearchParams();

  const studentData = useSelector(
    (state: RootState) => state.auth.studentData
  );
  const reduxToken = useSelector(
    (state: RootState) => state.auth?.accessToken
  );

  const classId = params.classId
    ? String(params.classId)
    : studentData?.classId?.toString() || '1';

  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const setupSubscription = () => {
      const targetPath = `/topic/class/${classId}/mode`;

      return stompClient.subscribe(targetPath, (msg) => {
        try {
          const body = JSON.parse(msg.body);

          if (body.mode === 'DIGITAL') {
            router.replace(
              `/screens/Classtime_Digital?classId=${classId}`
            );
          } else if (body.mode === 'NORMAL') {
            router.replace(
              `/screens/Classtime_Normal?classId=${classId}`
            );
          }
        } catch (e) {
          console.error('메시지 파싱 에러:', e);
        }
      });
    };

    let modeSub: any = null;

    const initSocket = async () => {
      let token = reduxToken;
      if (!token) {
        token = await SecureStore.getItemAsync('accessToken');
      }

      connectSocket(token || '');

      if (stompClient.connected) {
        modeSub = setupSubscription();
      } else {
        stompClient.onConnect = () => {
          modeSub = setupSubscription();
        };
      }
    };

    initSocket();

    return () => {
      if (modeSub) modeSub.unsubscribe();
    };
  }, [classId, reduxToken]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -height * 0.02,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bounceAnim, height]);

  return (
    <ImageBackground
      source={require('../../../assets/loading_background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={{ marginTop: height * 0.15 }}>
          <Text
            style={[
              styles.titleText,
              { fontSize: width * 0.04 },
            ]}
          >
            ⭐ 조금만 기다려 주세요! ⭐
          </Text>

          <Text
            style={[
              styles.subtitleText,
              { fontSize: width * 0.02 },
            ]}
          >
            선생님이 곧 수업을 시작하실 거에요!
          </Text>
        </View>

        <Animated.View
          style={[
            styles.doorWrapper,
            {
              marginTop: height * 0.06,
              transform: [{ translateY: bounceAnim }],
            },
          ]}
        >
          <Image
            source={require('../../../assets/door.png')}
            style={{
              width: width * 0.4,
              height: width * 0.4,
            }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </ImageBackground>
  );
}


const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },

  container: {
    flex: 1,
    alignItems: 'center',
  },

  titleText: {
    fontWeight: '900',
    color: '#5D4037',
    marginBottom: 20,
    textAlign: 'center',
  },

  subtitleText: {
    fontWeight: 'bold',
    color: '#7986CB',
    textAlign: 'center',
  },

  doorWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
