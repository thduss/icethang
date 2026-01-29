import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';

interface SignupState {
  teacherLoading: boolean;
  studentLoading: boolean;
  teacherSuccess: boolean;
  studentSuccess: boolean;
  error: string | null;
}

const initialState: SignupState = {
  teacherLoading: false,
  studentLoading: false,
  teacherSuccess: false,
  studentSuccess: false,
  error: null,
};


export const signupTeacher = createAsyncThunk<
  any,
  {
    email: string;
    password: string;
    teacherName: string;
  },
  { rejectValue: string }
>('signup/signupTeacher', async (payload, { rejectWithValue }) => {
  try {
    console.log('교사 회원가입 요청:', payload);

    const response = await api.post(
      '/auth/signup',
      payload
    );

    console.log('교사 회원가입 응답:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('교사 회원가입 실패:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    return rejectWithValue(
      error.response?.data?.message || '교사 회원가입 실패'
    );
  }
});


export const signupStudent = createAsyncThunk<
  any,
  {
    name: string;
    studentNumber: number;
    inviteCode: string;
    deviceUuid: string;
  },
  { rejectValue: string }
>('signup/signupStudent', async (payload, { rejectWithValue }) => {
  try {
    console.log('학생 회원가입 요청:', payload);

    const response = await api.post(
      '/auth/join/student',
      payload
    );

    console.log('학생 회원가입 응답:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('학생 회원가입 실패:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    return rejectWithValue(
      error.response?.data?.message || '학생 회원가입 실패'
    );
  }
});

const signupSlice = createSlice({
  name: 'signup',
  initialState,
  reducers: {
    resetSignupState: () => initialState,
  },
  extraReducers: (builder) => {
    builder

      .addCase(signupTeacher.pending, (state) => {
        state.teacherLoading = true;
        state.error = null;
        state.teacherSuccess = false;
      })
      .addCase(signupTeacher.fulfilled, (state) => {
        state.teacherLoading = false;
        state.teacherSuccess = true;
      })
      .addCase(signupTeacher.rejected, (state, action) => {
        state.teacherLoading = false;
        state.error = action.payload ?? '교사 회원가입 실패';
      })

      .addCase(signupStudent.pending, (state) => {
        state.studentLoading = true;
        state.error = null;
        state.studentSuccess = false;
      })
      .addCase(signupStudent.fulfilled, (state) => {
        state.studentLoading = false;
        state.studentSuccess = true;
      })
      .addCase(signupStudent.rejected, (state, action) => {
        state.studentLoading = false;
        state.error = action.payload ?? '학생 회원가입 실패';
      });
  },
});

export const { resetSignupState } = signupSlice.actions;
export default signupSlice.reducer;
