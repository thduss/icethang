import client from './client';

// 학급 생성 API
export const createClass = async (groupName: string) => {
  const body = { 
    groupName: groupName 
  };
  
  console.log("🚀 [API 전송] 학급 생성 데이터:", body); 

  const response = await client.post('/classes', body);
  return response.data;
};

// 학급 목록 조회 API
export const getClasses = async () => {
  console.log("📡 [API 요청] 학급 목록 조회 시작");
  const response = await client.get('/classes'); 
  const rawData = response.data;

  const parsedData = Array.isArray(rawData) ? rawData.map((item: any) => {
    const [gradeStr, classNumStr] = (item.groupName || "").split('-');
    
    return {
      id: item.classId,
      name: item.groupName,
      grade: parseInt(gradeStr, 10) || 0,
      classNum: parseInt(classNumStr, 10) || 0,
      isActive: true
    };
  }) : [];

  console.log("✅ [API 수신] 변환된 데이터 개수:", parsedData.length);
  return parsedData; 
};