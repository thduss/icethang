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

// 엑세스 토큰 실어 보내기
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
          if (session.token) token = session.token;
        }
      } catch (e) {}
    }

    if (!token) {
      try {
        token = await AsyncStorage.getItem('accessToken');
      } catch (e) {}
    }
    console.log("👉 인터셉터 진입! 토큰 유무:", !!token);
    if (token) {
      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers['Authorization'] = authHeader;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 토큰 갱신 로직

const handleTokenRefresh = async (originalRequest: any) => {
  if (originalRequest._retry) {
    return Promise.reject(new Error("토큰 갱신 실패 (무한루프 방지)"));
  }
  
  console.log("♻️ [Token Refresh] 토큰 만료 감지! 갱신을 시도합니다.");
  originalRequest._retry = true;

  try {
    let refreshToken = null;
    if (Platform.OS !== 'web') {
      refreshToken = await SecureStore.getItemAsync('refreshToken');
    }

    if (!refreshToken) {
      console.error("🚨 저장된 리프레시 토큰이 없습니다!");
      throw new Error('No refresh token');
    }

    console.log("📦 [Debug] 전송할 RefreshToken:", refreshToken.substring(0, 10) + "...");

    // Body는 비우고 Cookie 헤더만
    const { data } = await axios.post(
      `${BASE_URL}/auth/refresh`, 
      {}, 
      {
        headers: { 
          'Cookie': `refreshToken=${refreshToken}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );

    console.log("✅ [Token Refresh] 성공! 새 토큰을 받았습니다.");
    
    // 서버 응답 구조 대응
    const newAccessToken = data.accessToken || data.token; 
    const newRefreshToken = data.refreshToken;
    
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync('accessToken', newAccessToken);
      // 리프레시 토큰이 갱신되어 왔을 때만 저장
      if (newRefreshToken) await SecureStore.setItemAsync('refreshToken', newRefreshToken);
    }

    // 헤더 교체 후 재요청
    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
    return api(originalRequest);

  } catch (refreshError: any) {
    console.error("❌ [Token Refresh Failed] 서버 응답:", refreshError.response?.data);
    console.error("❌ [Token Refresh Failed] 상태 코드:", refreshError.response?.status);
    
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('userRole');
    }
    return Promise.reject(refreshError);
  }
};

api.interceptors.response.use(
  async (response) => {
    const url = response.config.url;

    if (url?.includes('login') || url?.includes('join')) {
        return response;
    }

    const data = response.data;

    if (typeof data === 'string' && (
        data.includes('<!DOCTYPE html>') || 
        data.includes('Please sign in') || 
        data.includes('Login with OAuth 2.0')
    )) {
        console.log(`⚠️ [Soft 401] HTML 로그인 페이지 감지 -> 갱신 시도`);
        return handleTokenRefresh(response.config);
    }

    const msg = data?.message || data?.msg || data?.error || (typeof data === 'string' ? data : "");
    const code = data?.code || data?.status;

    if (
        (typeof msg === 'string' && (msg.includes("만료") || msg.includes("로그인") || msg.includes("권한") || msg.includes("Session"))) ||
        code === 401 ||
        code === "401"
    ) {
      console.log(`⚠️ [Soft 401] 에러 메시지 감지: "${msg.substring(0, 30)}..." -> 갱신 시도`);
      return handleTokenRefresh(response.config);
    }

    console.log(`✅ [Response Success] ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      return handleTokenRefresh(error.config);
    }
    
    if (error.response) {
      console.error('❌ [API Error]:', error.response.status, error.response.data);
    } else {
      console.error('❌ [Error]:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;