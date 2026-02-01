import client from '../api/api'

export interface StudentItem {
  studentId: number
  studentName: string
  studentNumber: number
  deviceUuid?: string
}

export interface StudentLogResponse {
  logId: number
  date: string
  subject: string
  classNo: number
  earnedXp: number
  focusRate: number | null
  reason: string | null
  startTime: string | null
  endTime: string | null
}

export const getStudentLogs = async (
  classId: number,
  studentId: number
): Promise<StudentLogResponse[]> => {
  const response = await client.get(
    `/classes/${classId}/students/${studentId}/logs`
  )
  return Array.isArray(response.data) ? response.data : []
}


export const getStudentsByClass = async (
  classId: number
): Promise<StudentItem[]> => {
  const response = await client.get(`/classes/${classId}/students`)
  return Array.isArray(response.data) ? response.data : []
}

export const getStudentDetail = async (
  classId: number,
  studentId: number
) => {
  const response = await client.get(
    `/classes/${classId}/students/${studentId}`
  )
  return response.data
}

export const giveStudentXp = async (
  classId: number,
  studentId: number,
  amount: number,
  reason: string
) => {
  console.log('🚀 XP GIVE REQUEST', {
    method: 'POST',
    classId,
    studentId,
    amount,
    reason,
  });

  const response = await client.patch(  
    `/classes/${classId}/students/${studentId}/xp/give`,
    {
      amount,
      reason,
    }
  );
  return response.data;
};

export interface StudentXpResponse {
  currentLevel: number
  currentXp: number
  reason: string
}

export const getStudentXp = async (
  classId: number,
  studentId: number
): Promise<StudentXpResponse> => {
  const response = await client.get(
    `/classes/${classId}/students/${studentId}/xp`
  )
  return response.data
}