import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TEMP_UUID_KEY = 'temp_device_uuid';

export const getDeviceUUID = async () => {
  try {
    if (Platform.OS === 'android') {
      return await Application.getAndroidId(); 
    } else if (Platform.OS === 'ios') {
      return await Application.getIosIdForVendorAsync();
    }
    
    const savedId = await AsyncStorage.getItem(TEMP_UUID_KEY);
    if (savedId) return savedId;

    const newId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem(TEMP_UUID_KEY, newId);
    return newId;
    
  } catch (error) {
    console.error("UUID 추출 실패, 저장된 임시 ID 확인 중:", error);
    const savedId = await AsyncStorage.getItem(TEMP_UUID_KEY);
    if (savedId) return savedId;

    const fallbackId = `fallback-${Date.now()}`;
    await AsyncStorage.setItem(TEMP_UUID_KEY, fallbackId);
    return fallbackId;
  }
};