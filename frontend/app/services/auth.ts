import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserSession {
  isLoggedIn: boolean;
  role: 'teacher' | 'student' | null;
  name: string;
  id: string;
  school?: string;
}

const STORAGE_KEY = 'user_session';
const TEACHERS_KEY = 'registered_teachers'; // 📖 선생님 명부 (저장소 키)

export const AuthService = {
  // 1. 자동 로그인 체크
  checkSession: async (): Promise<UserSession | null> => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      return null;
    }
  },

  // 🆕 2. 선생님 회원가입 (기능 추가! ⭐)
  registerTeacher: async (email: string, pw: string, name: string, school: string): Promise<boolean> => {
    try {
      // 기존 명부 가져오기
      const existingTeachers = await AsyncStorage.getItem(TEACHERS_KEY);
      const teachers = existingTeachers ? JSON.parse(existingTeachers) : {};

      // 이미 있는지 확인
      if (teachers[email]) return false; // 이미 있는 이메일

      // 명부에 추가 (이메일을 키로 사용)
      teachers[email] = { pw, name, school };
      
      // 저장
      await AsyncStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));
      return true;
    } catch (e) {
      return false;
    }
  },

  // 3. 선생님 로그인 (업그레이드! ⭐)
  teacherLogin: async (email: string, pw: string): Promise<{ success: boolean; msg?: string }> => {
    // A. 하드코딩된 테스트 계정 확인
    if (email === 'teacher@test.com' && pw === '1234') {
      const session: UserSession = {
        isLoggedIn: true, role: 'teacher', name: '김싸피 선생님', id: email, school: '싸피 초등학교'
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return { success: true };
    }

    // B. 가입된 회원 명부 확인 (새로 추가된 로직)
    const existingTeachers = await AsyncStorage.getItem(TEACHERS_KEY);
    if (existingTeachers) {
      const teachers = JSON.parse(existingTeachers);
      const user = teachers[email];

      if (user) {
        if (user.pw === pw) {
          // 로그인 성공!
          const session: UserSession = {
            isLoggedIn: true, role: 'teacher', name: user.name, id: email, school: user.school
          };
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
          return { success: true };
        } else {
          return { success: false, msg: '비밀번호가 틀렸습니다.' };
        }
      }
    }

    return { success: false, msg: '가입되지 않은 이메일입니다.' };
  },

  // ... (학생 로그인, 로그아웃은 기존과 동일)
  studentLogin: async (grade: string, classNum: string, number: string, name: string, code: string): Promise<{ success: boolean; msg?: string }> => {
    const VALID_AUTH_CODE = "1234"; 
    if (code !== VALID_AUTH_CODE) return { success: false, msg: '인증코드가 틀렸어요!' };
    const session: UserSession = { isLoggedIn: true, role: 'student', name: name, id: `${grade}-${classNum}-${number}` };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return { success: true };
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
};