import { StyleSheet, Text, View } from 'react-native'
import LeftSidebar from '../../components/Menu/LeftSidebar'
import MainArea from './MainArea'
import Header from './Header'

const index = () => {
  return (
    <View style={styles.outer}>
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
    justifyContent: "center", 
    alignItems: "center",     
  },

  screen: {
    width: 1280,
    height: 800,
    flexDirection: "row",   
    backgroundColor: "#F3EED4",
  },
  
  rightArea: {
    flex: 1,
    paddingHorizontal: 32,  
    paddingTop: 24,   
    backgroundColor: "#F3EED4",
  },
})