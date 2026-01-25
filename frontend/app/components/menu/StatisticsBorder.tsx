import { View, StyleSheet, Pressable, Text } from 'react-native'
import { ReactNode } from 'react'

interface StatisticsCardProps {
  children: ReactNode
}

const StatisticsCard = ({ children }: StatisticsCardProps) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.content}>
        {children}
      </View>
    </View >
  )
}

export default StatisticsCard

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#E3DDB5',
  },

  content: {
    borderWidth: 2,
    borderColor: '#3A2E1F',
    backgroundColor: '#E3DDB5',
    // marginHorizontal: 10,
    // marginTop: 16,
    borderRadius: 5,
    padding: 16,
  },
})
