import { StyleSheet, Text, View, Pressable } from 'react-native'
import { router } from 'expo-router'

const Header = () => {
  return (
    <View style={styles.container}>
      {/* 상단 줄 */}
      <View style={styles.topRow}>

        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>인증 코드</Text>
          <Text style={styles.codeValue}>1359</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.timetable,
            pressed && styles.timetablePressed,
          ]}
        >
          <Text
            style={styles.timetableText}
            onPress={() => router.push('/screens/Teacher_TimeTable')}
          >
            시간표</Text>
        </Pressable>

      </View>

      <View style={styles.titleArea}>
        <Text style={styles.title}>스마트 교실 도우미</Text>
        <Text style={styles.subTitle}>김코치 선생님</Text>
      </View>
    </View>
  )
}

export default Header


const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F6F1E3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D8C9A3',
    elevation: 0,
  },

  codeLabel: {
    fontSize: 15,
    color: '#6B5A3C',
    fontWeight: '600',
  },

  codeValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#2F2A1F',
  },


  codeText: {
    fontSize: 17,
    fontWeight: '600',
  },

  timetable: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 50,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#C9B68E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },

  timetablePressed: {
    transform: [{ translateY: 3 }],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    elevation: 2,
  },

  timetableText: {
    fontSize: 17,
    fontWeight: '600',
  },

  titleArea: {
    alignItems: "center",
    marginTop: 16,
  },
  title: {
    fontSize: 50,
    fontWeight: "800",
    marginBottom: 6,
  },

  subTitle: {
    fontSize: 30,
    color: "#555",
  },
})