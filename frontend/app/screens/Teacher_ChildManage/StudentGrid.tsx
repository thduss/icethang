import { StyleSheet, View, Text, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import StudentCard from './StudentCard'
import { getStudentsByClass, StudentItem } from '../../services/studentService'
import { RootState, AppDispatch } from '../../store/stores'
import { setStudents, clearStudents } from '../../store/slices/memberSlice'

const StudentGrid = () => {
  const dispatch = useDispatch<AppDispatch>();

  const selectedClassId = useSelector(
    (state: RootState) => state.class.selectedClassId
  )

  const students = useSelector((state: RootState) => state.member.students);
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStudents = async (classId: number) => {
      // 새 학급을 불러오기 전에 기존 목록을 먼저 비워줍니다.
      dispatch(clearStudents());
      
      setLoading(true)
      setError(null)
      console.log("📍 현재 요청하는 classId:", classId);

      try {
        const data = await getStudentsByClass(classId)

        dispatch(setStudents(data)); 
        
      } catch (err: any) {
        console.error("❌ 학생 목록 조회 에러:", err);
        setError(
          err?.message || '학생 목록을 불러오지 못했습니다.'
        )
        // 에러 시에도 목록 비우기
        dispatch(clearStudents());
      } finally {
        setLoading(false)
      }
    }

    if (selectedClassId) {
      fetchStudents(selectedClassId)
    } else {
      // 학급 선택이 해제되거나 삭제된 경우 목록 비우기
      dispatch(clearStudents());
    }
  }, [selectedClassId, dispatch])

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
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    justifyContent: 'flex-start',
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateText: {
    marginTop: 10,
    fontSize: 16,
    color: '#8D7B68',
    fontFamily: 'Jua-Regular',
  },
})