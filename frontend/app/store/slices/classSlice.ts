import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { createClass, getClasses, getSpecificClass, ClassDto } from '../../services/classService';

interface ClassState {
  items: ClassDto[];
  selectedClassId: number | null;
  selectedClassDetail: any | null;
  loading: boolean;
  success: boolean;
  error: string | null;
}

const initialState: ClassState = {
  items: [],
  selectedClassId: null,
  selectedClassDetail: null,
  loading: false,
  success: false,
  error: null,
};

// 목록 조회 Thunk
export const fetchClasses = createAsyncThunk(
  'class/fetchClasses',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getClasses();
      console.log(`✅ [Slice] 목록 로드 완료 (${data.length}개)`);
      return data;
    } catch (error: any) {
      console.error('❌ [Slice] 목록 로드 실패:', error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 학급 생성 Thunk
export const addClass = createAsyncThunk(
  'class/addClass',
  async (payload: { grade: number; classNum: number }, { rejectWithValue }) => {
    try {
      const newClassId = await createClass(payload);
      return newClassId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 상세 조회 Thunk
export const fetchClassDetail = createAsyncThunk(
  'class/fetchClassDetail',
  async (classId: number, { rejectWithValue }) => {
    try {
      const data = await getSpecificClass(classId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const classSlice = createSlice({
  name: 'class',
  initialState,
  reducers: {
    selectClass: (state, action: PayloadAction<number>) => {
      state.selectedClassId = action.payload;
      console.log("💾 [Redux] 반 선택됨:", action.payload);
    },
    resetStatus: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 목록 조회
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
      // 학급 생성
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
      })
      // 상세 조회
      .addCase(fetchClassDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClassDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedClassId = action.payload.classId; 
        state.selectedClassDetail = action.payload;
      })
      .addCase(fetchClassDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { selectClass, resetStatus } = classSlice.actions;
export default classSlice.reducer;