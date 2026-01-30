import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getSchedules, updateSchedule, createSchedule, ScheduleDto } from '../../services/scheduleService';

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

export const modifySchedule = createAsyncThunk(
  'schedule/modifySchedule',
  async (payload: { groupId: number; timetableId: number; data: Partial<ScheduleDto> }, { rejectWithValue }) => {
    try {
      await updateSchedule(payload.groupId, payload.timetableId, {
        subject: payload.data.subject || '',
      });
      
      console.log(`✅ [Slice] 수정 성공: ID=${payload.timetableId}`);

      return { timetableId: payload.timetableId, changes: payload.data };
    } catch (error: any) {
      console.error('❌ [Slice] 수정 실패:', error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const addSchedule = createAsyncThunk(
  'schedule/addSchedule',
  async (payload: { groupId: number; data: { dayOfWeek: string; classNo: number; subject: string; sem: number } }, { rejectWithValue }) => {
    try {
      const newTimetableId = await createSchedule(payload.groupId, payload.data);
      console.log(`✅ [Slice] 생성 성공, 새 ID: ${newTimetableId}`);

      return {
        timetableId: newTimetableId,
        dayOfWeek: payload.data.dayOfWeek,
        classNo: payload.data.classNo,
        subject: payload.data.subject,
        sem: payload.data.sem
      } as ScheduleDto;
    } catch (error: any) {
      console.error('❌ [Slice] 생성 실패:', error.message);
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
      })
      .addCase(modifySchedule.fulfilled, (state, action) => {
        const { timetableId, changes } = action.payload;
        const index = state.items.findIndex(item => item.timetableId === timetableId);
        if (index !== -1){
          state.items[index] = { ...state.items[index], ...changes };
        }
      })
      .addCase(addSchedule.fulfilled, (state, action) => {
        state.items.push(action.payload);
      });
  },
});

export const { clearSchedules } = scheduleSlice.actions;
export default scheduleSlice.reducer;