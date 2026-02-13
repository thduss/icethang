import { Pressable, StyleSheet, Text, View } from 'react-native'

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
        <Pressable style={styles.box} onPress={onPressYear}>
          <Text style={styles.text}>{`${year}\uB144`}</Text>
        </Pressable>

        <Pressable style={styles.box} onPress={onPressMonth}>
          <Text style={styles.text}>{`${month}\uC6D4`}</Text>
        </Pressable>
      </View>

      {onPressExp && (
        <Pressable style={styles.expButton} onPress={onPressExp}>
          <Text style={styles.expButtonText}>{'\uACBD\uD5D8\uCE58 \uAD00\uB9AC'}</Text>
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
    flexWrap: 'wrap',
    rowGap: 8,
    marginBottom: 12,
  },
  dateGroup: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 1,
  },
  expButton: {
    backgroundColor: '#5B4A2F',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  box: {
    paddingVertical: 2,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#E8DFC1',
    borderWidth: 2,
    borderColor: '#3B332A',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
})
