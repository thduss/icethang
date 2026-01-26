import { StyleSheet, Text, View } from 'react-native'
import BackButton from './BackButton'



interface StatisticsHeaderProps {
  name: string
  number: number
  onBack: () => void
}


const StatisticsHeader = ({ number, name, onBack }: StatisticsHeaderProps) => {
  return (
    <View style={styles.container}>
      <View style={{ zIndex: 10 }}>
        <BackButton onPress={onBack} />
      </View>

      <View style={styles.center} pointerEvents='box-none'>
        <Text style={styles.title}>
          학생: {number}번 {name} | 집중도 통계 대시보드
        </Text>
      </View>
    </View>
  )
}

export default StatisticsHeader

const styles = StyleSheet.create({

  container: {
    flexDirection: "row",
    alignItems: "center",
  },

  center:{
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',   
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
  },
})