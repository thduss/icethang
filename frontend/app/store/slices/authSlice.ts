import { createSlice, PayloadAction, createAsyncThunk, isAnyOf } from '@reduxjs/toolkit';
import api from '../../api/api'; 
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getDeviceUUID } from '../../services/device'; 

const initialState: AuthState = {
  isLoggedIn: false,
  userRole: null,
  accessToken: null,
  studentData: null,
  teacherData: null,
  loading: false,
  error: null,
};

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
}


export interface TeacherInfo {
  teacherId: number;
  email: string;
  teacherName: string;
  school: SchoolInfo;
}

interface AuthResponse<T> {
  token: string;
  data: T;
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

export const joinTeacher = createAsyncThunk<AuthResponse<TeacherInfo>, { email: string; password: string; name: string; school: string }>(
  'auth/joinTeacher',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/join/teacher', {
        email: payload.email,
        password: payload.password,
        teacherName: payload.name,
        schoolName: payload.school,
      });
      const { token, ...data } = response.data;
      if (Platform.OS !== 'web' && token) {
        await SecureStore.setItemAsync('accessToken', token);
        await SecureStore.setItemAsync('userRole', 'teacher');
      }
      return { token, data: data as TeacherInfo };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '선생님 가입 실패');
    }
  }
);

export const loginTeacher = createAsyncThunk<AuthResponse<TeacherInfo>, { email: string; password: string }>(
  'auth/loginTeacher',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login/teacher', {
        email: payload.email,
        password: payload.password,
      });
      const { token, ...data } = response.data;
      if (Platform.OS !== 'web' && token) {
        await SecureStore.setItemAsync('accessToken', token);
        await SecureStore.setItemAsync('userRole', 'teacher');
      }
      return { token, data: data as TeacherInfo };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '선생님 로그인 실패');
    }
  }
);


export const joinStudent = createAsyncThunk<AuthResponse<StudentInfo>, { code: string; name: string; number: number }>(
  'auth/joinStudent',
  async (payload, { rejectWithValue }) => {
    try {
      const deviceUuid = await getDeviceUUID(); 
      const response = await api.post('/auth/join/student', {
        name: payload.name,
        studentNumber: payload.number,
        inviteCode: payload.code,
        deviceUuid: deviceUuid || 'unknown-device'
      });
      const { token, ...data } = response.data;
      if (Platform.OS !== 'web' && token) {
        await SecureStore.setItemAsync('accessToken', token);
        await SecureStore.setItemAsync('userRole', 'student');
      }
      return { token, data: data as StudentInfo }; 
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '학생 등록 실패');
    }
  }
);

export const loginStudent = createAsyncThunk<AuthResponse<StudentInfo>, void>(
  'auth/loginStudent',
  async (_, { rejectWithValue }) => {
    try {
      const deviceUuid = await getDeviceUUID();
      const response = await api.post('/auth/login/student', { deviceUuid });
      const { token, ...data } = response.data;
      if (Platform.OS !== 'web' && token) {
        await SecureStore.setItemAsync('accessToken', token);
        await SecureStore.setItemAsync('userRole', 'student');
      }
      return { token, data: data as StudentInfo };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '학생 로그인 실패');
    }
  }
);


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      Object.assign(state, initialState);
      if (Platform.OS !== 'web') {
        SecureStore.deleteItemAsync('accessToken');
        SecureStore.deleteItemAsync('userRole');
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        isAnyOf(joinStudent.fulfilled, loginStudent.fulfilled),
        (state, action) => {
          state.loading = false;
          state.isLoggedIn = true;
          state.userRole = 'student';
          state.accessToken = action.payload.token;
          state.studentData = action.payload.data;
          state.teacherData = null;
          state.error = null;
        }
      )
      .addMatcher(
        isAnyOf(joinTeacher.fulfilled, loginTeacher.fulfilled),
        (state, action) => {
          state.loading = false;
          state.isLoggedIn = true;
          state.userRole = 'teacher';
          state.accessToken = action.payload.token;
          state.teacherData = action.payload.data;
          state.studentData = null;
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
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.error = action.payload || '알 수 없는 에러가 발생했습니다.';
        }
      );
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;