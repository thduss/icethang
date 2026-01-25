import { StyleSheet, Text, View, Pressable } from 'react-native'

interface StatisticsFilterProps {
  year: number
  month: number
  onPressYear?: () => void
  onPressMonth?: () => void
  onPressExp?: () => void
}

const StatisticsFilter = ({ year, month, onPressYear, onPressMonth, onPressExp }: StatisticsFilterProps) => {

  return (
    <View style={styles.row}>

      <View style={styles.dateGroup}>
        {/* 연도 버튼 */}
        <Pressable style={styles.box} onPress={onPressYear}>
          <Text style={styles.text}>
            {year}년
          </Text>
        </Pressable>

        {/* 월 버튼 */}
        <Pressable style={styles.box} onPress={onPressMonth}>
          <Text style={styles.text}>
            {month}월
          </Text>
        </Pressable>
      </View>

      {/* 경험치 관리 버튼 */}
      {onPressExp && (
        <Pressable style={styles.expButton} onPress={onPressExp}>
          <Text style={styles.expButtonText}>경험치 관리</Text>
        </Pressable>
      )}

    </View>
  )
}

export default StatisticsFilter

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  dateGroup: {
    flexDirection: 'row',
    gap: 8,
  },

  expButton: {
    backgroundColor: '#5B4A2F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },

  expButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  box: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#E8DFC1',
    borderWidth: 2,
    borderColor: "#3B332A",
  },

  text: {
    fontSize: 20,
    fontWeight: '600',
  },

})