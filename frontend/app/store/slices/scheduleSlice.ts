// app/store/slices/scheduleSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getSchedules, ScheduleDto } from '../../services/scheduleService';

interface ScheduleState {
  items: ScheduleDto[];
  loading: boolean;
  error: string | null;
}

const initialState: ScheduleState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchSchedules = createAsyncThunk(
  'schedule/fetchSchedules',
  async (payload: { groupId: number; targetDate: string }, { rejectWithValue }) => {
    try {
      const data = await getSchedules(payload.groupId, payload.targetDate);
      console.log(`✅ [Slice] 시간표 로드 완료 (${data.length}개)`);
      return data;
    } catch (error: any) {
      console.error('❌ [Slice] 시간표 로드 실패:', error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    clearSchedules: (state) => {
      state.items = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSchedules } = scheduleSlice.actions;
export default scheduleSlice.reducer;