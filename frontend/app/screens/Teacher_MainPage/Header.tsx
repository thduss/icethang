import { StyleSheet, Text, View, Pressable } from 'react-native'


const Header = () => {
  return (
    <View style={styles.container}>
      {/* 상단 줄 */}
      <View style={styles.topRow}>
        
        <View style={styles.codeBox}>
          <Text style={styles.codeText}>인증 코드 : 1359</Text>
        </View>

        <Pressable style={styles.timetable}>
          <Text style={styles.timetableText}>시간표</Text>
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
    marginBottom: 40,   // 아래쪽 여백 (다음 영역과 간격 벌리기 위해)
  },

  // 상단 가로 줄 (인증코드 + 시간표 버튼)
  topRow: {
    flexDirection: "row",   // 지식 요소를 가로 방향으로 배치
    justifyContent: "space-between",   // 양쪽 끝으로 배치
    alignItems: "center",   // 세로 중앙 정렬
  },

  // 인증 코드 버튼
  codeBox: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C9B68E',
  },


  codeText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // 시간표 버튼
  timetable: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#C9B68E',
  },

  timetableText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // 제목 영역 (가운데 정렬함)
  titleArea: {
    alignItems: "center",   // 가로 가운데 정렬
    marginTop: 16,    // 위쪽 여백
  },
  title: {
    fontSize: 50, // 글자 크기
    fontWeight: "800", // 굵은 글씨
    marginBottom: 6,
  },

  subTitle: {
    fontSize: 30,
    color: "#555",

  },
})