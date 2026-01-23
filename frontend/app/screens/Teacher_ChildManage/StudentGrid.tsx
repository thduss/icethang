import { StyleSheet, View } from 'react-native'
import StudentCard from './StudentCard'

// 임시 더미 데이터
const students = [
  { id: 1, name: '김하나', number: 1 },
  { id: 2, name: '이싸피', number: 2 },
  { id: 3, name: '박싸피', number: 3 },
  { id: 4, name: '정싸피', number: 4 },
  { id: 5, name: '강싸피', number: 5 },
  { id: 6, name: '장싸피', number: 6 },
  { id: 7, name: '심싸피', number: 7 },
  { id: 8, name: '종싸피', number: 8 },
]

const StudentGrid = () => {
  return (
    <View style={styles.grid}>
      {students.map((student) => (
        <StudentCard
          key={student.id}
          name={student.name}
          number={student.number}
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
    flexWrap: 'wrap',   // 여러 줄
    alignItems: 'flex-start',
  },
})
