import axios, { AxiosRequestConfig } from 'axios';
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

const handleTokenRefresh = async (originalRequest: any) => {
  try {
    console.log("🔄 [Token] 토큰 만료 혹은 세션 종료 감지 -> 재발급 시도");
    
    const refreshToken = Platform.OS !== 'web' 
      ? await SecureStore.getItemAsync('refreshToken') 
      : null;

    if (!refreshToken) throw new Error("No refresh token");

    const response = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
      headers: { 'Cookie': `refreshToken=${refreshToken}` }
    });

    const setCookie = response.headers['set-cookie'] || response.headers['Set-Cookie'];
    let newToken = null;

    if (setCookie) {
      const tokenCookie = setCookie.find((c:string) => c.toLowerCase().includes('accesstoken'));
      if (tokenCookie) newToken = tokenCookie.split(';')[0].split('=')[1];
    }

    if (newToken) {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync('accessToken', newToken);
      }
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    }
    throw new Error("Token refresh failed");
  } catch (err) {
    console.log("❌ [Token] 재발급 최종 실패 -> 로그인 만료 처리");
    return Promise.reject(err);
  }
};

api.interceptors.request.use(
  async (config) => {
    let token: string | null = null;
    try {
      if (Platform.OS !== 'web') {
        token = await SecureStore.getItemAsync('accessToken');
      }
      if (!token) {
        token = await AsyncStorage.getItem('accessToken');
      }
    } catch (e) {
      console.log('⚠️ Token Load Error:', e);
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`👉 [Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => {
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
      console.log(`⚠️ [Soft 401] HTML 감지 -> 갱신 시도`);
      return handleTokenRefresh(response.config);
    }

    const msg = data?.message || data?.msg || data?.error || (typeof data === 'string' ? data : "");
    const code = data?.code || data?.status;

    if (
        (typeof msg === 'string' && (msg.includes("만료") || msg.includes("로그인") || msg.includes("권한") || msg.includes("Session"))) ||
        code === 401 ||
        code === "401"
    ) {
      console.log(`⚠️ [Soft 401] 메시지/코드 감지: "${msg.substring(0, 20)}..." -> 갱신 시도`);
      return handleTokenRefresh(response.config);
    }

    console.log(`✅ [Response Success] ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      return handleTokenRefresh(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default api;