import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Application from 'expo-application'; 
import { Platform } from 'react-native';

// 1. .env 파일에서 서버 주소 가져오기
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://i14e204.p.ssafy.io/api';

// 2. Axios 인스턴스 생성 (공통 설정)
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
  timeout: 10000, 
});

// 디버깅용 로그
if (!process.env.EXPO_PUBLIC_API_URL) {
  console.log("⚠️ 알림: .env 파일을 찾지 못해 기본 주소를 사용합니다:", BASE_URL);
} else {
  console.log("✅ 연결된 서버 주소:", BASE_URL);
}

export interface UserSession {
  isLoggedIn: boolean;
  role: 'teacher' | 'student' | null;
  name: string;
  id: string;
  school?: string;
  token?: string;
}

const STORAGE_KEY = 'user_session';

//  기기 고유 ID 가져오기
const getDeviceId = async () => {
  let uuid = null;
  if (Platform.OS === 'android') {
    uuid = Application.getAndroidId(); 
  } else if (Platform.OS === 'ios') {
    uuid = await Application.getIosIdForVendorAsync();
  }
  return uuid || "android-test-" + Math.random().toString(36).substring(7);
};

export const AuthService = {
  // 1. 자동 로그인 체크 
  checkSession: async (): Promise<UserSession | null> => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error("세션 불러오기 실패:", e);
      return null;
    }
  },

  // 2. 선생님 회원가입
  registerTeacher: async (email: string, pw: string, name: string, school: string): Promise<boolean> => {
    try {
      const response = await api.post('/teachers/register', {
        email: email,
        password: pw,
        name: name,
        school: school
      });

      return true; 
    } catch (error: any) {
      console.error("회원가입 실패:", error.response?.data || error.message);
      return false;
    }
  },

  // 3. 선생님 로그인 
  teacherLogin: async (email: string, pw: string): Promise<{ success: boolean; msg?: string }> => {
    try {
      // 테스트 계정
      if (email === 'test' && pw === '1234') {
        // ...테스트 로직...
      }

      const response = await api.post('/teachers/login', { 
        email, 
        password: pw 
      });

      const data = response.data;

      // 로그인 성공 처리
      const session: UserSession = {
        isLoggedIn: true,
        role: 'teacher',
        name: data.name,    
        id: email,
        school: data.school, 
        token: data.token   
      };
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return { success: true };

    } catch (error: any) {
      console.error("선생님 로그인 에러:", error.response?.data || error.message);
      const msg = error.response?.data?.message || '이메일 또는 비밀번호가 틀렸습니다.';
      return { success: false, msg };
    }
  },

  // 4. 학생 로그인 (Axios 사용)
  studentLogin: async (name: string, studentNumber: string, inviteCode: string): Promise<{ success: boolean; msg?: string; data?: any }> => {
    try {
      const deviceUuid = await getDeviceId();

      console.log("🚀 학생 로그인 요청:", { name, studentNumber, inviteCode, deviceUuid });

      const response = await api.post('/students/login', {
        name: name,
        studentNumber: parseInt(studentNumber),
        inviteCode: inviteCode,
        deviceUuid: deviceUuid
      });

      // 쿠키 처리
      const cookie = response.headers['set-cookie'];
      let token = '';
      if (cookie) {
        token = Array.isArray(cookie) ? cookie.join('; ') : cookie;
      }

      const session: UserSession = {
        isLoggedIn: true,
        role: 'student',
        name: response.data.name || name,
        id: response.data.studentNumber?.toString() || studentNumber,
        token: token
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      console.log("✅ 학생 로그인 성공");

      return { success: true, data: response.data };

    } catch (error: any) {
      console.error("❌ 학생 로그인 에러:", error.response?.data || error.message);
      const msg = error.response?.data?.message || '로그인 정보를 확인해주세요.';
      return { success: false, msg };
    }
  },

  // 5. 로그아웃
  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
};