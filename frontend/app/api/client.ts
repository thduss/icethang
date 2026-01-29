import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';


const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL; 

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


client.interceptors.request.use(
  async (config) => {
    let token: string | null = null;

    try {
      if (Platform.OS !== 'web') {
        token = await SecureStore.getItemAsync('accessToken');
        if (token) console.log('🔑 [Client] SecureStore에서 토큰 발견!');
      }
    } catch (e) {
      console.log('⚠️ SecureStore 에러:', e);
    }

    if (!token) {
      try {
        const sessionJson = await AsyncStorage.getItem('user_session');
        if (sessionJson) {
          const session = JSON.parse(sessionJson);
          if (session.token) {
            token = session.token;
            console.log('🔑 [Client] AsyncStorage(user_session)에서 토큰 발견!');
          }
        }
      } catch (e) {
        console.log('⚠️ AsyncStorage 파싱 에러:', e);
      }
    }

    if (!token) {
      try {
        token = await AsyncStorage.getItem('accessToken');
        if (token) console.log('🔑 [Client] AsyncStorage(accessToken)에서 토큰 발견!');
      } catch (e) {}
    }

    if (token) {
      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers['Authorization'] = authHeader;
    } else {
      console.log('🚨 [API 요청] 비상! 모든 저장소를 뒤졌으나 토큰이 없습니다. (URL:', config.url, ')');
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default client;