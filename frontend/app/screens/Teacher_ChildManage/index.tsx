import { StyleSheet, Text, View } from 'react-native'
import LeftSidebar from 'app/components/menu/LeftSidebar'
import StudentGrid from './StudentGrid'
import BackButton from 'app/components/menu/BackButton'

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
  },
})