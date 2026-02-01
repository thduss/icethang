import api from '../api/api';

export const startLessonApi = async (classId: number) => {
  // POST /classes/{classId}/session/start
  const response = await api.post(`/classes/${classId}/session/start`);
  return response.data; 
};