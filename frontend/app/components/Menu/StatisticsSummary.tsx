import { StyleSheet, Text, View } from 'react-native'

interface SummaryItem {
  label: string
  value: string
}

interface StatisticsSummaryProps {
  left: SummaryItem
  right: SummaryItem
}


const StatisticsSummary = ({ left, right }: StatisticsSummaryProps) => {
  
  return (
    <View style={styles.container}>
      
      {/* 왼쪽 요약 박스 */}
      <View style={styles.box}>
        <Text style={styles.label}>{left.label}</Text>
        <Text style={styles.value}>{left.value}</Text>
      </View>

      {/* 오른쪽 요약 박스 */}
      <View style={styles.box}>
        <Text style={styles.label}>{right.label}</Text>
        <Text style={styles.value}>{right.value}</Text>
      </View>
    </View>
  )
}

export default StatisticsSummary

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },

  box: {
    flex: 1,
    paddingVertical: 3,
    borderRadius: 16,
    backgroundColor: '#F6F3DC',
    alignItems: 'center',
  },

  label: {
    fontSize: 12,
    color: '#555',
  },
  
  value: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
})
