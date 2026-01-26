import { StyleSheet, Text, View } from 'react-native'
import LeftSidebar from 'app/components/Menu/LeftSidebar'
import StudentGrid from './StudentGrid'
import BackButton from 'app/components/Menu/BackButton'

const index = () => {
  return (
    <View style={styles.container}>
      <LeftSidebar />
      <BackButton />
      <StudentGrid />
    </View>
  )
}

export default index

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F3EED4"
  },
})