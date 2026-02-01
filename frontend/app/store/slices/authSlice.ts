import { createSlice, PayloadAction, createAsyncThunk, isAnyOf } from '@reduxjs/toolkit';
import api from '../../api/api'; 
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getDeviceUUID } from '../../services/device'; 

export interface SchoolInfo {
  schoolId: number;
  schoolName: string;
}

export interface StudentInfo {
  studentId: number;
  studentName: string;
  studentNumber: number;
  deviceUuid: string;
  currentXp: number;
  currentLevel: number;
  schoolId: number;
  groupId: number | null;
  className?: string;
}

export interface TeacherInfo {
  teacherId: number;
  email: string;
  teacherName: string;
  school: SchoolInfo;
}

interface AuthState {
  isLoggedIn: boolean;
  userRole: 'student' | 'teacher' | null;
  accessToken: string | null;
  studentData: StudentInfo | null;
  teacherData: TeacherInfo | null;
  loading: boolean;
  error: string | null;
  isRegistered: boolean; 
}

const initialState: AuthState = {
  isLoggedIn: false,
  userRole: null,
  accessToken: null,
  studentData: null,
  teacherData: null,
  loading: false,
  error: null,
  isRegistered: true,
};

const extractToken = (response: any) => {
  const setCookie = response.headers['set-cookie'] || response.headers['Set-Cookie'];
  if (setCookie) {
    const cookieArray = Array.isArray(setCookie) ? setCookie : [setCookie];
    const tokenCookie = cookieArray.find(c => c.toLowerCase().includes('accesstoken'));
    if (tokenCookie) {
      return tokenCookie.split(';')[0].split('=')[1];
    }
  }
  return response.data?.accessToken || null;
};


// 1. 선생님 로그인
export const loginTeacher = createAsyncThunk(
  'auth/loginTeacher',
  async (loginData: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login/teacher', loginData);
      const token = extractToken(response);

      if (token) {
        if (Platform.OS !== 'web') {
          await SecureStore.setItemAsync('accessToken', token);
          await SecureStore.setItemAsync('userRole', 'teacher');
        }
        return { accessToken: token, data: response.data };
      }
      return rejectWithValue('토큰을 찾을 수 없습니다.');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '로그인 실패');
    }
  }
);

// 2. 학생 로그인 (재입장)
export const loginStudent = createAsyncThunk(
  'auth/loginStudent',
  async (_, { rejectWithValue }) => {
    try {
      const deviceUuid = await getDeviceUUID();
      const response = await api.post('/auth/login/student', { deviceUuid });
      const token = extractToken(response);

      if (token) {
        if (Platform.OS !== 'web') {
          await SecureStore.setItemAsync('accessToken', token);
          await SecureStore.setItemAsync('userRole', 'student');
        }
        return { accessToken: token, data: response.data };
      }
      return rejectWithValue('토큰 없음');
    } catch (error: any) {
      if (error.response?.status === 404) return rejectWithValue('NOT_REGISTERED');
      return rejectWithValue(error.response?.data?.message || '로그인 실패');
    }
  }
);

// 3. 학생 최초 로그인
export const joinStudent = createAsyncThunk(
  'auth/joinStudent',
  async (studentData: { name: string; studentNumber: number; inviteCode: string }, { rejectWithValue }) => {
    try {
      const deviceUuid = await getDeviceUUID();
      const response = await api.post('/auth/join/student', { ...studentData, deviceUuid });
      const token = extractToken(response);

      if (token) {
        if (Platform.OS !== 'web') {
          await SecureStore.setItemAsync('accessToken', token);
          await SecureStore.setItemAsync('userRole', 'student');
        }
        return { accessToken: token, data: response.data };
      }
      return rejectWithValue('가입 성공 후 토큰을 받지 못했습니다.');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '가입 실패');
    }
  }
);

// 4. 로그아웃
export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('userRole');
    }
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuth: (state) => {
      state.isLoggedIn = false;
      state.userRole = null;
      state.accessToken = null;
      state.studentData = null;
      state.teacherData = null;
    },
    resetRegistrationStatus: (state) => {
      state.isRegistered = true;
    }
  },
  extraReducers: (builder) => {
    builder
      // 학생 관련 성공 처리
      .addMatcher(
        isAnyOf(joinStudent.fulfilled, loginStudent.fulfilled),
        (state, action) => {
          state.loading = false;
          state.isLoggedIn = true;
          state.userRole = 'student';
          state.accessToken = action.payload.accessToken;
          state.studentData = action.payload.data;
          state.isRegistered = true;
        }
      )
      // 선생님 관련 성공 처리
      .addMatcher(
        isAnyOf(loginTeacher.fulfilled),
        (state, action) => {
          state.loading = false;
          state.isLoggedIn = true;
          state.userRole = 'teacher';
          state.accessToken = action.payload.accessToken;
          state.teacherData = action.payload.data;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.error = action.payload;
          if (action.payload === 'NOT_REGISTERED') {
            state.isRegistered = false;
          }
        }
      );
  },
});

export const { clearAuth, resetRegistrationStatus } = authSlice.actions;
export default authSlice.reducer;