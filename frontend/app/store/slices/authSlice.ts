import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../../api/client';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface SchoolInfo {
  school_id: number;
  school_name: string;
}

interface StudentInfo {
  student_id: number;
  school_id: number;
  group_id: number | null;
  student_number: number;
  student_name: string;
  device_uuid: string;
  current_xp: number;
  current_level: number;
  equipped_character_id: number | null; 
  equipped_background_id: number | null; 
}

interface TeacherInfo {
  teacher_id: number;
  email: string;
  school: SchoolInfo; 
  teacher_name: string;
  provider: string | null;
}

interface AuthState {
  isLoggedIn: boolean;
  userRole: 'student' | 'teacher' | null;
  accessToken: string | null;
  studentData: StudentInfo | null;
  teacherData: TeacherInfo | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isLoggedIn: false,
  userRole: null,
  accessToken: null,
  studentData: null,
  teacherData: null,
  loading: false,
  error: null,
};

export const loginStudent = createAsyncThunk(
  'auth/loginStudent',
  async (loginPayload: { code: string }, { rejectWithValue }) => {
    try {
      const response = await client.post('/auth/login/student', loginPayload);
      
      if (Platform.OS !== 'web' && response.data.token) { 
        await SecureStore.setItemAsync('accessToken', response.data.token);
      }
      return response.data; 
    } catch (error: any) {
      return rejectWithValue(error.message || '로그인 실패');
    }
  }
);

export const loginTeacher = createAsyncThunk(
  'auth/loginTeacher',
  async (loginPayload: { email: string; pw: string }, { rejectWithValue }) => {
    try {
      console.log('📡 [AuthSlice] 로그인 시도:', loginPayload.email);

      const requestBody = {
        email: loginPayload.email,
        password: loginPayload.pw
      };

      const response = await client.post('/auth/login/teacher', requestBody);
      
      console.log('🔥 [AuthSlice] 서버 응답 성공!');

      const accessToken = response.data.accessToken; 
      const refreshToken = response.data.refreshToken;

      if (!accessToken) {
        throw new Error('응답에 accessToken이 없습니다.');
      }

      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync('accessToken', accessToken);
        if (refreshToken) {
          await SecureStore.setItemAsync('refreshToken', refreshToken);
        }
        console.log("💾 [AuthSlice] 토큰 SecureStore 저장 완료");
      }

      return {
        token: accessToken,
        data: response.data 
      };

    } catch (error: any) {
      console.error('❌ [AuthSlice] 로그인 실패:', error.response?.data || error.message);
      return rejectWithValue('이메일 또는 비밀번호를 확인해주세요.');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    studentLoginSuccess: (state, action: PayloadAction<{ token: string; data: StudentInfo }>) => {
      state.isLoggedIn = true;
      state.userRole = 'student';
      state.accessToken = action.payload.token;
      state.studentData = action.payload.data;
    },
    teacherLoginSuccess: (state, action: PayloadAction<{ token: string; data: TeacherInfo }>) => {
      state.isLoggedIn = true;
      state.userRole = 'teacher';
      state.accessToken = action.payload.token;
      state.teacherData = action.payload.data;
    },
    logout: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoggedIn = true;
        state.userRole = 'student';
        state.accessToken = action.payload.token;
        state.studentData = action.payload.data;
      })
      .addCase(loginStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(loginTeacher.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginTeacher.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoggedIn = true;
        state.userRole = 'teacher';
        state.accessToken = action.payload.token;
        state.teacherData = action.payload.data;
      })
      .addCase(loginTeacher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { studentLoginSuccess, teacherLoginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;