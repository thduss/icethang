import client from '../api/api'

export const getStudentDetail = async (
  classId: number,
  studentId: number
) => {
  const response = await client.get(
    `/classes/${classId}/students/${studentId}`
  )
  return response.data
}
