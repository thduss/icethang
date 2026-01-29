import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.0.2.2:8080';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

client.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');

    console.log(`📡 [API 요청] ${config.method?.toUpperCase()} ${config.url} | Token: ${token ? '있음' : '없음'}`);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default client;