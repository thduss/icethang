import { StyleSheet, View, Text, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import StudentCard from './StudentCard'
import client from '../../api/api'
import { RootState } from '../../store/stores'


interface StudentItem {
  studentId: number
  studentName: string   // 목록 조회할 땐 studentName임!
  studentNumber: number
  deviceUuid?: string
}

const StudentGrid = () => {
  const selectedClassId = useSelector(
    (state: RootState) => state.class.selectedClassId
  )
  const [students, setStudents] = useState<StudentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStudents = async (classId: number) => {
      setLoading(true)
      setError(null)
      console.log("📍 현재 요청하는 classId:", classId);

      try {
        const response = await client.get(`/classes/${classId}/students`)
        console.log("✅ API 서버에서 받아온 데이터:", response.data);
        const data = Array.isArray(response.data) ? response.data : []
        setStudents(data)
      } catch (err: any) {
        console.error("❌ 학생 목록 조회 에러:", err);
        const message =
          typeof err?.response?.data === 'string'
            ? err.response.data
            : err?.message || '학생 목록을 불러오지 못했습니다.'
        setError(message)
        setStudents([])
      } finally {
        setLoading(false)
      }
    }

    if (selectedClassId) {
      fetchStudents(selectedClassId)
    } else {
      setStudents([])
      setError(null)
    }
  }, [selectedClassId])

  if (!selectedClassId) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.stateText}>좌측에 있는 반을 선택하세요</Text>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#8D7B68" />
        <Text style={styles.stateText}>로딩중..</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.stateText}>{error}</Text>
      </View>
    )
  }

  return (
    <View style={styles.grid}>
      {students.map((student) => (
        <StudentCard
          key={student.studentId}
          name={student.studentName || (student as any).student_name}
          number={student.studentNumber}
          onPress={() => {
            router.push({
              pathname: '/Teacher_Statistics',
              params: {
                name: student.studentName,
                number: String(student.studentNumber),
                studentId: String(student.studentId),
                classId: String(selectedClassId),
              },
            })
          }}
        />
      ))}
    </View>
  )
}

export default StudentGrid

const styles = StyleSheet.create({
  grid: {
    flex: 1,
    padding: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  stateText: {
    marginTop: 12,
    fontSize: 40,
    color: '#8D7B68',
  },
})
