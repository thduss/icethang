import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ 에뮬레이터면 'http://10.0.2.2:8080', 실제 폰이면 'http://내PC_IP주소:8080'
// 백엔드 포트가 8080이 맞는지 확인하세요!
const BASE_URL = 'http://10.0.2.2:8080'; 

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// [로그인 함수]
export const loginAPI = async (email, password) => {
  try {
    // 1. DTO에 맞춰서 email, password 전송
    const response = await client.post('/auth/login', { 
      email: email, 
      password: password 
    });

    // 2. 백엔드가 토큰을 Body로 줬다고 가정 (백엔드 수정 필수!)
    // 만약 백엔드가 수정을 거부하면, 쿠키를 뜯어오는 복잡한 방법을 써야 합니다.
    const { accessToken, refreshToken } = response.data;

    if (accessToken) {
      // 3. 토큰을 폰에 저장 (자동 로그인용)
      await AsyncStorage.setItem('accessToken', accessToken);
      if(refreshToken) await AsyncStorage.setItem('refreshToken', refreshToken);
      return true; // 성공!
    } else {
      console.warn("토큰이 응답에 없습니다. 백엔드 응답을 확인하세요:", response.data);
      return false;
    }

  } catch (error) {
    console.error("로그인 실패:", error.response ? error.response.data : error.message);
    throw error; // 화면에서 에러를 잡을 수 있게 던짐
  }
};