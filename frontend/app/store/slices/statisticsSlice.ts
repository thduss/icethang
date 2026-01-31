import api from '../../api/api';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface DailyStat {
  classNo: number;
  subject: string;
  focusRate: number;
  outOfSeatCount: number;
}

export interface WeeklyStat {
  date: string;
  dayOfWeek: string;
  averageFocusRate: number;
}

export interface MonthlyStat {
  date: string;
  averageFocusRate: number;
}

export interface SubjectStat {
  subject: string;
  avgFocusRate: number;
  totalClassCount: number;
  avgOutOfSeat: number;
}

interface StatisticsState {
  daily: DailyStat[];
  weekly: WeeklyStat[];
  monthly: MonthlyStat[];
  subjects: SubjectStat[];
  loading: boolean;
  error: string | null;
}

const initialState: StatisticsState = {
  daily: [],
  weekly: [],
  monthly: [],
  subjects: [],
  loading: false,
  error: null,
};

/**
 * 1. 일별 통계 가져오기
 */
export const fetchDailyStatistics = createAsyncThunk(
  'statistics/fetchDaily',
  async ({ groupId, studentId, date }: { groupId: number; studentId: number; date: string }, thunkAPI) => {
    try {
      const response = await api.get(`/classes/${groupId}/students/${studentId}/statistics/daily`, {
        params: { date },
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data || '일별 통계 로드 실패');
    }
  }
);

/**
 * 2. 주별 통계 가져오기
 */
export const fetchWeeklyStatistics = createAsyncThunk(
  'statistics/fetchWeekly',
  async ({ groupId, studentId, startDate }: { groupId: number; studentId: number; startDate: string }, thunkAPI) => {
    try {
      const response = await api.get(`/classes/${groupId}/students/${studentId}/statistics/weekly`, {
        params: { startDate },
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data || '주별 통계 로드 실패');
    }
  }
);

/**
 * 3. 월별 통계 가져오기 (히트맵)
 */
export const fetchMonthlyStatistics = createAsyncThunk(
  'statistics/fetchMonthly',
  async ({ groupId, studentId, month }: { groupId: number; studentId: number; month: string }, thunkAPI) => {
    try {
      console.log('📡 월간 통계 요청 시작:', { groupId, studentId, month });
      
      const response = await api.get(`/classes/${groupId}/students/${studentId}/statistics/monthly`, {
        params: { 
          month: month
        },
      });
      
      console.log('✅ 월간 통계 응답 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 월간 통계 응답 에러:', error.response?.data || error.message);
      return thunkAPI.rejectWithValue(error.response?.data || '월간 통계 실패');
    }
  }
);

/**
 * 4. 과목별 통계 가져오기
 */
export const fetchSubjectStatistics = createAsyncThunk(
  'statistics/fetchSubjects',
  async ({ groupId, studentId, month }: { groupId: number; studentId: number; month: string }, thunkAPI) => {
    try {
      const response = await api.get(`/classes/${groupId}/students/${studentId}/statistics/subjects`, {
        params: { month },
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data || '과목별 통계 로드 실패');
    }
  }
);

// --- Slice ---

const statisticsSlice = createSlice({
  name: 'statistics',
  initialState,
  reducers: {
    clearStatistics: (state) => {
      state.daily = [];
      state.weekly = [];
      state.monthly = [];
      state.subjects = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fulfilled (데이터 수신)
      .addCase(fetchDailyStatistics.fulfilled, (state, action: PayloadAction<DailyStat[]>) => {
        state.loading = false;
        state.daily = action.payload;
      })
      .addCase(fetchWeeklyStatistics.fulfilled, (state, action: PayloadAction<WeeklyStat[]>) => {
        state.loading = false;
        state.weekly = action.payload;
      })
      .addCase(fetchMonthlyStatistics.fulfilled, (state, action: PayloadAction<MonthlyStat[]>) => {
        state.loading = false;
        state.monthly = action.payload;
      })
      .addCase(fetchSubjectStatistics.fulfilled, (state, action: PayloadAction<SubjectStat[]>) => {
        state.loading = false;
        state.subjects = action.payload;
      })
      // Pending (로딩 공통 처리)
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      // Rejected (에러 공통 처리)
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action: any) => {
          state.loading = false;
          state.error = action.payload;
        }
      );
  },
});

export const { clearStatistics } = statisticsSlice.actions;
export default statisticsSlice.reducer;