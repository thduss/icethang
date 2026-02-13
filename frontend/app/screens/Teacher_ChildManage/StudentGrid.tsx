import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  FlatList,
} from 'react-native'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import StudentCard from './StudentCard'
import { getStudentsByClass } from '../../services/studentService'
import { RootState, AppDispatch } from '../../store/stores'
import { setStudents, clearStudents } from '../../store/slices/memberSlice'

const NUM_COLUMNS = 4

const StudentGrid = () => {
  const dispatch = useDispatch<AppDispatch>()

  const selectedClassId = useSelector(
    (state: RootState) => state.class.selectedClassId
  )

  const students = useSelector((state: RootState) => state.member.students)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStudents = async (classId: number) => {
      dispatch(clearStudents())
      setLoading(true)
      setError(null)

      try {
        const data = await getStudentsByClass(classId)
        dispatch(setStudents(data))
      } catch (err: any) {
        setError(err?.message || '학생 목록을 불러오지 못했습니다.')
        dispatch(clearStudents())
      } finally {
        setLoading(false)
      }
    }

    if (selectedClassId) {
      fetchStudents(selectedClassId)
    } else {
      dispatch(clearStudents())
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
    <FlatList
      data={students}
      numColumns={NUM_COLUMNS}
      keyExtractor={(item) => item.studentId.toString()}
      contentContainerStyle={styles.list}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <View style={styles.cardWrapper}>
          <StudentCard
            name={item.studentName}
            number={item.studentNumber}
            onPress={() => {
              router.push({
                pathname: '/Teacher_Statistics',
                params: {
                  name: item.studentName,
                  number: String(item.studentNumber),
                  studentId: String(item.studentId),
                  classId: String(selectedClassId),
                  hideSidebar: 'true',
                },
              })
            }}
          />
        </View>
      )}
    />
  )
}

export default StudentGrid

const styles = StyleSheet.create({
  list: {
    padding: 20,
  },
  row: {
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  cardWrapper: {
    flex: 1,
    maxWidth: '25%',
    paddingHorizontal: 10,
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
