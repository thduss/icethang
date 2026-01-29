import * as Application from 'expo-application';
import { Platform } from 'react-native';

export const getDeviceUUID = async () => {
  try {
    if (Platform.OS === 'android') {
      return await Application.getAndroidId(); 
    } else if (Platform.OS === 'ios') {
      return await Application.getIosIdForVendorAsync();
    }
    return 'web-device-test'; 
  } catch (error) {
    console.error("UUID 추출 실패:", error);
    return `temp-${Date.now()}`; 
  }
};