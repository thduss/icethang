import 'react-native-gesture-handler'
import { ThemeProvider } from './context/ThemeContext';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { store, persistor } from './store/stores';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ActivityIndicator, View, AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { checkAndConvertTime, updatePeriodOnServer } from './store/slices/timeSlice';
import { RootState, AppDispatch } from './store/stores';

SplashScreen.preventAutoHideAsync();

function TimeManager() {
  const dispatch = useDispatch<AppDispatch>();
  const currentPeriod = useSelector((state: RootState) => state.time.currentPeriod);

  useEffect(() => {
    dispatch(checkAndConvertTime());
    const timer = setInterval(() => {
      dispatch(checkAndConvertTime());
    }, 60000);

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        dispatch(checkAndConvertTime());
      }
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [dispatch]);

  useEffect(() => {
    if (currentPeriod > 0) {
      dispatch(updatePeriodOnServer(currentPeriod));
    }
  }, [currentPeriod, dispatch]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    const timer = setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <TimeManager /> 
          <ThemeProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="screens/select/index" />
              <Stack.Screen name="screens/teacher_login/index" />
              <Stack.Screen name="screens/student_login/index" />
              <Stack.Screen name="screens/Teacher_MainPage" />
            </Stack>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

// 리덕스 로딩용 화면 
function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
}