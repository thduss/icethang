import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface EndClassRequest {
  date: string;       
  startTime: string;  
  endTime: string;    
  subject: string;    
  classNo: number;    
}

// 수업 종료 보고 API
export const endClassSession = async (classId: number, data: EndClassRequest) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    
    // PATCH /classes/{classId}/session/end
    const response = await axios.patch(`${BASE_URL}/classes/${classId}/session/end`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ [API] 수업 종료 보고 완료:', response.data);
    return true;
  } catch (error) {
    console.error('🚨 [API] 수업 종료 보고 실패:', error);
    return false;
  }
};