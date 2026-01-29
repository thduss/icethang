import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    let token: string | null = null;

    // SecureStore 확인
    try {
      if (Platform.OS !== 'web') {
        token = await SecureStore.getItemAsync('accessToken');
      }
    } catch (e) {
      console.log('⚠️ SecureStore 에러:', e);
    }

    // AsyncStorage 확인
    if (!token) {
      try {
        const sessionJson = await AsyncStorage.getItem('user_session');
        if (sessionJson) {
          const session = JSON.parse(sessionJson);
          if (session.token) {
            token = session.token;
            console.log('🔑 [API] AsyncStorage(user_session)에서 토큰 발견');
          }
        }
      } catch (e) {
        console.log('⚠️ AsyncStorage 파싱 에러:', e);
      }
    }

    // AsyncStorage 확인
    if (!token) {
      try {
        token = await AsyncStorage.getItem('accessToken');
        if (token) console.log('🔑 [API] AsyncStorage(accessToken)에서 토큰 발견');
      } catch (e) {}
    }

    // 토큰 헤더 설정
    if (token) {
      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers['Authorization'] = authHeader;
    } else {
      console.log('ℹ️ [API] 토큰 없이 요청 보냄:', config.url);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;