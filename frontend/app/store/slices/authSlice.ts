import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

interface GroupSettings { // 반 학생 선생 공용 모드(디지털/일반 수업 선택용)
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
}

const initialState: AuthState = {
  isLoggedIn: false,
  userRole: null,
  accessToken: null,
  studentData: null,
  teacherData: null,
};

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
});

export const { studentLoginSuccess, teacherLoginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;