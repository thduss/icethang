import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createClass, getClasses } from '../../services/classAPI';
import client from '../../api/client'; 

export interface ClassItem {
  id: number;
  grade: number;
  classNum: number;
  name: string;
  isActive: boolean;
}

export const fetchClasses = createAsyncThunk(
  'class/fetchClasses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/classes');
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        throw new Error('로그인이 필요하거나 세션이 만료되었습니다.');
      }

      console.log('✅ 학급 목록 로드 성공');
      return response.data;
    } catch (error: any) {
      console.error('❌ 학급 목록 로드 실패:', error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const addClass = createAsyncThunk(
  'class/addClass',
  async (payload: { grade: number; classNum: number }, { rejectWithValue }) => {
    try {
      console.log(`🚀 [API 전송] 학급 생성 데이터:`, payload);

      const response = await client.post('/classes', {
        grade: payload.grade,
        classNum: payload.classNum
      });

      console.log('✅ 학급 생성 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 학급 생성 실패:', error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

interface ClassState {
  items: ClassItem[];
  loading: boolean;
  success: boolean;
  error: string | null;
}

const initialState: ClassState = {
  items: [],
  loading: false,
  success: false,
  error: null,
};

const classSlice = createSlice({
  name: 'class',
  initialState,
  reducers: {
    resetStatus: (state) => {
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(addClass.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addClass.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(addClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetStatus } = classSlice.actions;
export default classSlice.reducer;