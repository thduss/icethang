import { createSlice, PayloadAction, createAsyncThunk, AnyAction } from '@reduxjs/toolkit';
import client from '../../api/client';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getDeviceUUID } from '../../services/device'; 


interface SchoolInfo { school_id: number; school_name: string; }

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


export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) return rejectWithValue('저장된 토큰 없음');

      const response = await client.get('/auth/me');
      const role = await SecureStore.getItemAsync('userRole');

      return { 
        token, 
        role: role as 'student' | 'teacher', 
        data: response.data 
      };
    } catch (error: any) {
      return rejectWithValue('세션 만료');
    }
  }
);


export const joinStudent = createAsyncThunk(
  'auth/joinStudent',
  async (payload: { code: string; name: string; number: number }, { rejectWithValue }) => {
    try {
      const device_uuid = await getDeviceUUID(); 
      
      const response = await client.post('/auth/join/student', {
        ...payload,
        device_uuid: device_uuid || 'unknown-device' 
      });
      
      const { token } = response.data;

      if (Platform.OS !== 'web' && token) {
        await SecureStore.setItemAsync('accessToken', token);
        await SecureStore.setItemAsync('userRole', 'student');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '최초 입장 실패');
    }
  }
);


export const loginStudent = createAsyncThunk(
  'auth/loginStudent',
  async (_, { rejectWithValue }) => {
    try {
      const device_uuid = await getDeviceUUID(); 

      const response = await client.post('/auth/login/student', {
        device_uuid: device_uuid 
      });
      
      const { token } = response.data;

      if (Platform.OS !== 'web' && token) {
        await SecureStore.setItemAsync('accessToken', token);
        await SecureStore.setItemAsync('userRole', 'student');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '기기 인식 로그인 실패');
    }
  }
);


export const loginTeacher = createAsyncThunk(
  'auth/loginTeacher',
  async (payload: { email: string; pw: string }, { rejectWithValue }) => {
    try {
      const response = await client.post('/auth/login/teacher', {
        email: payload.email,
        password: payload.pw
      });
      const { accessToken, refreshToken, data } = response.data;

      if (Platform.OS !== 'web' && accessToken) {
        await SecureStore.setItemAsync('accessToken', accessToken);
        await SecureStore.setItemAsync('userRole', 'teacher');
        if (refreshToken) await SecureStore.setItemAsync('refreshToken', refreshToken);
      }
      return { token: accessToken, data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '선생님 로그인 실패');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      client.post('/auth/logout').catch(() => {});
      Object.assign(state, initialState);
      if (Platform.OS !== 'web') {
        SecureStore.deleteItemAsync('accessToken');
        SecureStore.deleteItemAsync('refreshToken');
        SecureStore.deleteItemAsync('userRole');
      }
      AsyncStorage.removeItem('user_session');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoggedIn = true;
        state.accessToken = action.payload.token;
        state.userRole = action.payload.role;
        if (action.payload.role === 'student') state.studentData = action.payload.data;
        else state.teacherData = action.payload.data;
      })
      .addCase(loginTeacher.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoggedIn = true;
        state.userRole = 'teacher';
        state.accessToken = action.payload.token;
        state.teacherData = action.payload.data;
      })
      .addMatcher(
        (action): action is PayloadAction<{ token: string; data: StudentInfo }> =>
          [loginStudent.fulfilled.type, joinStudent.fulfilled.type].includes(action.type),
        (state, action) => {
          state.loading = false;
          state.isLoggedIn = true;
          state.userRole = 'student';
          state.accessToken = action.payload.token;
          state.studentData = action.payload.data;
        }
      )
      .addMatcher(
        (action): action is AnyAction => action.type.endsWith('/pending'),
        (state) => { state.loading = true; state.error = null; }
      )
      .addMatcher(
        (action): action is PayloadAction<string> => action.type.endsWith('/rejected'),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || '에러가 발생했습니다.';
        }
      );
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;