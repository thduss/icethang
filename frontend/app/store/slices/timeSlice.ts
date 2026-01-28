import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface TimeState {
  currentPeriod: number;
  lastUpdated: string | null;
}

const initialState: TimeState = {
  currentPeriod: 0,
  lastUpdated: null,
};

export const updatePeriodOnServer = createAsyncThunk(
  'time/updatePeriod',
  async (period: number, thunkAPI) => {
    try {
      const response = await axios.post('', { period }); //여기다가 나중에 url 입력
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data || '업데이트 실패');
    }
  }
);

const timeSlice = createSlice({
  name: 'time',
  initialState,
  reducers: {
    checkAndConvertTime: (state) => {
      const now = new Date();
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

      const schedule = [
        { period: 1, start: 9 * 60 + 0 }, 
        { period: 2, start: 9 * 60 + 50 },  
        { period: 3, start: 10 * 60 + 40 }, 
        { period: 4, start: 11 * 60 + 30 }, 
        { period: 5, start: 13 * 60 + 0 },  
        { period: 6, start: 13 * 60 + 50 },
      ];

  const found = [...schedule].reverse().find(s => currentTotalMinutes >= s.start);

  if (found) {
    console.log(`지금${found.period}교시`);

    if (state.currentPeriod !== found.period) {
      state.currentPeriod = found.period;
      state.lastUpdated = now.toISOString();
    }
  } else {
    console.log(`1교시 시작 전`);
  }
},
    updateCurrentPeriod: (state, action) => {
      state.currentPeriod = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(updatePeriodOnServer.fulfilled, (state) => {
      console.log(`${state.currentPeriod}교시 서버 동기화 완료`);
    });
  },
});

export const { checkAndConvertTime } = timeSlice.actions;
export default timeSlice.reducer;