import client from '../api/api'

export interface StudentItem {
  studentId: number
  studentName: string
  studentNumber: number
  deviceUuid?: string
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