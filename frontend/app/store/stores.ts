import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer, 
  FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER 
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '@react-native-seoul/kakao-login';

// 아래부터 리듀서
import authReducer from './slices/authSlice'; 
import themeReducer from './slices/themeSlice';
import memberReducer from './slices/memberSlice';
import signupReducer from './slices/signupSlice';
import timeReducer from './slices/timeSlice';


const rootReducer = combineReducers({
  auth: authReducer,   
  theme: themeReducer,
  member: memberReducer,
  signup: signupReducer,
  time: timeReducer,
});


const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth','theme'] // 자동 로그인 & 테마 유지
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;