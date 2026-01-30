import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 (토큰 주입)
api.interceptors.request.use(
  async (config) => {
    let token: string | null = null;

    try {
      if (Platform.OS !== 'web') {
        token = await SecureStore.getItemAsync('accessToken');
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
            console.log('🔑 [API] AsyncStorage(user_session)에서 토큰 발견');
          }
        }
      } catch (e) {
        console.log('⚠️ AsyncStorage 파싱 에러:', e);
      }
    }

    if (!token) {
      try {
        token = await AsyncStorage.getItem('accessToken');
        if (token) console.log('🔑 [API] AsyncStorage(accessToken)에서 토큰 발견');
      } catch (e) {}
    }

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

// --- 추가된 응답 인터셉터 (디버깅용) ---
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [Response Success] ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // 서버가 응답을 줬으나 에러인 경우 (400, 404, 500 등)
      console.error('❌ [API Response Error]:', error.response.status, error.response.data);
    } else if (error.request) {
      // 요청은 나갔으나 응답이 아예 없는 경우 (Network Error)
      console.error('❌ [API Network Error]: 서버에 연결할 수 없습니다. IP 주소(10.0.2.2)를 확인하세요.');
    } else {
      console.error('❌ [API Error]:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;