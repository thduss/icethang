import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// 로그인용 슬라이스 (학교+교사+학생)
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

interface GroupSettings { // 반 학생 선생 공용 모드(디지털/일반 수업 선택용)- 추가 사용 가능성 있어서 냅둔거
  groups_name: string;
  allow_digital_mode: boolean; 
  allow_normal_mode: boolean;
  allow_theme_change: boolean;
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
      const response = await api.post('/auth/login/student', loginPayload);
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
      console.log('로그인 시도:', loginPayload);
      const response = await api.post('/auth/login/teacher', loginPayload);
      console.log('응답 데이터:', response.data);

      if (Platform.OS !== 'web' && response.data.token) {
        await SecureStore.setItemAsync('accessToken', response.data.token);
      }

      return response.data; 
    } catch (error: any) {
      console.error('로그인 에러:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || '이메일 또는 비밀번호를 확인해주세요.');
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