import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'user_session';

// 💾 1. 세션 저장 (로그인/회원가입 성공 시 사용)
export const saveSession = async (role: 'teacher' | 'student') => {
  try {
    const data = JSON.stringify({ isLoggedIn: true, role });
    await AsyncStorage.setItem(STORAGE_KEY, data);
  } catch (e) {
    console.error('저장 실패:', e);
  }
};

// 🕵️ 2. 세션 불러오기 (앱 켤 때 사용)
export const getSession = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data != null ? JSON.parse(data) : null;
  } catch (e) {
    console.error('불러오기 실패:', e);
    return null;
  }
};

// 🗑️ 3. 로그아웃 (테스트용)
export const clearSession = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('삭제 실패:', e);
  }
};