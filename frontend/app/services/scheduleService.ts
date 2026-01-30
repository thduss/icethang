import api from "app/api/api";

export interface ScheduleDto {
  timetableId: number;
  dayOfWeek: string;
  classNo: number;
  subject: string;
  sem: number;
}

// 시간표 조회
export const getSchedules = async (groupId: number, targetDate: string): Promise<ScheduleDto[]> => {
  console.log(`📡 [Service] 시간표 조회 요청: ClassID=${groupId}, Date=${targetDate}`);
  
  const response = await api.get(`/classes/${groupId}/schedules`, {
    params: { targetDate }
  });

  console.log("🔥 [Debug] 서버 응답 원본:", JSON.stringify(response.data, null, 2));

  if (Array.isArray(response.data)) {
    return response.data.map((item: any) => ({
      timetableId: item.timetableId || item.timetable_id,
      dayOfWeek: item.dayOfWeek || item.day_of_week,
      classNo: item.classNo || item.class_no,
      subject: item.subject,
      sem: item.sem
    }));
  }

  if (response.data.data && Array.isArray(response.data.data)) {
    console.log("⚠️ [Debug] 데이터가 data 필드 안에 있었습니다.");
    return response.data.data.map((item: any) => ({
      timetableId: item.timetableId || item.timetable_id,
      dayOfWeek: item.dayOfWeek || item.day_of_week,
      classNo: item.classNo || item.class_no,
      subject: item.subject,
      sem: item.sem
    }));
  }

  return [];
};

// 시간표 수정
export const updateSchedule = async (
  groupId: number, 
  timetableId: number, 
  data: { subject: string; dayOfWeek?: string; classNo?: number; sem?: number }
) => {
  console.log(`🚀 [Service] 시간표 수정 요청: ID=${timetableId}, 과목=${data.subject}`);
  
  // 명세서: PUT /classes/{groupId}/schedules/{timetableId}
  const response = await api.put(`/classes/${groupId}/schedules/${timetableId}`, data);
  return response.data;
};

// 시간표 수정2(빈칸 수정)
export const createSchedule = async (
  groupId: number,
  data: { dayOfWeek: string; classNo: number; subject: string; sem: number }
) => {
  console.log(`🚀 [Service] 시간표 생성 요청: ${data.dayOfWeek} ${data.classNo}교시 - ${data.subject}`);

  // 명세서 POST /classes/{groupId}/schedules
  const response = await api.post(`/classes/${groupId}/schedules`, data);

  return response.data;
};