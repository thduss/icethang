import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    // 리듀서 넣는 자리(일단 공란)
    // 위에 리듀서 만들어서 위에 import 하고 여기다가 넣으면 됨 경로 '../reducers/...
  },
});