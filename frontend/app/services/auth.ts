import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. .env 파일에서 서버 주소 가져오기
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// 디버깅용 로그 (앱 실행 시 콘솔 확인)
if (!BASE_URL) {
  console.error("🚨 오류: .env 파일에서 EXPO_PUBLIC_API_URL을 찾을 수 없습니다.");
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

  // 2. 선생님 회원가입 (서버로 요청)
  registerTeacher: async (email: string, pw: string, name: string, school: string): Promise<boolean> => {
    try {
      const response = await fetch(`${BASE_URL}/api/teachers/register`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: pw,
          name: name,
          school: school
        }),
      });

      if (response.ok) {
        return true; 
      } else {
        const errorData = await response.json(); 
        console.log("회원가입 실패 사유:", errorData);
        return false;
      }
    } catch (e) {
      console.error("서버 통신 오류 (회원가입):", e);
      return false;
    }
  },

  //  3. 선생님 로그인 (서버로 요청)
  teacherLogin: async (email: string, pw: string): Promise<{ success: boolean; msg?: string }> => {
    try {
      // 하드코딩 테스트 계정 (필요 없으면 삭제)
      if (email === 'test' && pw === '1234') {
      }

      // ✅ 진짜 서버 요청
      const response = await fetch(`${BASE_URL}/api/teachers/login`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw }),
      });

      const data = await response.json();

      if (response.ok) {
        // 로그인 성공! 서버에서 받은 정보로 세션 생성
        const session: UserSession = {
          isLoggedIn: true,
          role: 'teacher',
          name: data.name,     // 백엔드가 보내주는 필드명 확인 필요
          id: email,
          school: data.school, // 백엔드가 보내주는 필드명 확인 필요
          token: data.token    // (JWT 토큰이 있다면 저장)
        };
        
        // 폰에 로그인 정보 저장 (앱 꺼도 유지되도록)
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        return { success: true };
      } else {
        return { success: false, msg: data.message || '이메일 또는 비밀번호가 틀렸습니다.' };
      }
    } catch (e) {
      console.error("로그인 서버 에러:", e);
      return { success: false, msg: '서버와 연결할 수 없습니다.' };
    }
  },

  // 4. 학생 로그인 (서버로 요청)
  studentLogin: async (grade: string, classNum: string, number: string, name: string, code: string): Promise<{ success: boolean; msg?: string }> => {
    try {
      const response = await fetch(`${BASE_URL}/api/students/login`, { // 👈 백엔드 주소 확인
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade,
          classNum,
          number,
          name,
          code
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const session: UserSession = {
          isLoggedIn: true,
          role: 'student',
          name: name,
          id: `${grade}-${classNum}-${number}`,
          token: data.token
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        return { success: true };
      } else {
        return { success: false, msg: data.message || '로그인 정보를 확인해주세요.' };
      }
    } catch (e) {
      console.error("학생 로그인 에러:", e);
      return { success: false, msg: '서버 통신 실패' };
    }
  },

  // 5. 로그아웃
  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
};