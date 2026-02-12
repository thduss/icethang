import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store/stores'
import { useEffect } from 'react'
import { fetchTeacherMe } from '../../store/slices/authSlice'

const Header = () => {
  const dispatch = useDispatch<AppDispatch>()
  const inviteCode = useSelector((state: RootState) => state.class.selectedClassDetail?.inviteCode)
  const teacherName = useSelector((state: RootState) => state.auth.teacherData?.teacherName)

  useEffect(() => {
    dispatch(fetchTeacherMe())
  }, [dispatch])

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>인증 코드</Text>
          <Text style={styles.codeValue}>{inviteCode ?? '----'}</Text>
        </View>

        <TouchableOpacity
          style={styles.timetable}
          activeOpacity={0.7}
          onPress={() => router.push('/screens/Teacher_TimeTable')}
        >
          <Text style={styles.timetableText}>시간표</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleArea}>
        <Text style={styles.title}>스마트 교실 도우미</Text>
        <Text style={styles.subTitle}>
          {teacherName ? `${teacherName} 선생님` : '로딩 중...'}
        </Text>
      </View>
    </View>
  )
}

export default Header

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFBF0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8C9A3',
  },
  codeLabel: {
    fontSize: 16,
    color: '#6B5A3C',
    fontWeight: '600',
    marginRight: 8,
  },
  codeValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2F2A1F',
  },
  timetable: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#C9B68E',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timetableText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  titleArea: {
    alignItems: "center",
    marginTop: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: "900",
    color: '#2F2A1F',
  },
  subTitle: {
    fontSize: 26,
    color: "#666",
    marginTop: 4,
  },
})