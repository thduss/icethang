import { StyleSheet, Text, View } from 'react-native'
import LeftSidebar from '../../components/menu/LeftSidebar'
import MainArea from './MainArea'
import Header from './Header'

// 최상위 화면
const index = () => {
  return (
    <View style={styles.outer}>
      {/* 컴포넌트 고정 view */}
      <View style={styles.screen}>
        <LeftSidebar />

        <View style={styles.rightArea}>
          <Header />
          <MainArea />
        </View>
      </View>
    </View>
  )
}
export default index

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: "#F3EED4",
    justifyContent: "center", // 세로 중앙
    alignItems: "center",     // 가로 중앙
  },

  screen: {
    width: 1280,
    height: 800,
    flexDirection: "row",   // 방향: 가로
    backgroundColor: "#F3EED4",
  },
  
  rightArea: {
    flex: 1,
    paddingHorizontal: 32,  // 좌우 안쪽 여백
    paddingTop: 24,   // 위 안쪽 여백
    backgroundColor: "#F3EED4",
  },
})