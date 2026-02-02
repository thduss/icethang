import api from "app/api/api";

export interface ClassDto {
  classId: number; 
  grade: number;
  classNum: number;
  inviteCode?: string;
  teacherId?: number;
}

// 1. 학급 생성 API (POST /classes)
export const createClass = async (data: { grade: number; classNum: number }) => {
  console.log("🚀 [Service] 학급 생성 요청:", data); 
  const response = await api.post('/classes', data);
  return response.data;
};

// 2. 학급 목록 조회 API (GET /classes)
export const getClasses = async (): Promise<ClassDto[]> => {
  console.log("📡 [Service] 학급 목록 조회 요청");
  const response = await api.get('/classes');

  if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
    throw new Error('로그인이 필요하거나 세션이 만료되었습니다.');
  }

  const rawData = response.data;

  if (Array.isArray(rawData)) {
    return rawData.map((item: any) => ({
      classId: item.classid || item.classId, 
      grade: item.grade,
      classNum: item.classNum,
      inviteCode: item.inviteCode,
      teacherId: item.teacherId
    }));
  }
  
  return []; 
};

// 3. 학급 상세 조회 API (GET /classes/{classId})
export const getSpecificClass = async (classId: number) => {
  console.log(`📡 [Service] 학급 상세 조회 요청: ${classId}`);
  const response = await api.get(`/classes/${classId}`);
  return response.data;
};

// 4. 학급 삭제 API (DELETE /classes/{classId})
export const deleteClassAPI = async (classId: number) => {
  console.log(`🗑️ [Service] 반 삭제 요청: ID ${classId}`);
  const response = await api.delete(`/classes/${classId}`);
  return response.data;
};
