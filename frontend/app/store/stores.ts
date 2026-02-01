import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer, 
  FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER 
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '@react-native-seoul/kakao-login';

import authReducer from './slices/authSlice'; 
import themeReducer from './slices/themeSlice';
import memberReducer from './slices/memberSlice';
import signupReducer from './slices/signupSlice';
import timeReducer from './slices/timeSlice';
import classReducer from './slices/classSlice'
import scheduleReducer from './slices/scheduleSlice'
import statisticsReducer from './slices/statisticsSlice';


const rootReducer = combineReducers({
  auth: authReducer,   
  theme: themeReducer,
  member: memberReducer,
  signup: signupReducer,
  time: timeReducer,
  class: classReducer,
  schedule: scheduleReducer,
  statistics: statisticsReducer,
});


const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['theme']
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