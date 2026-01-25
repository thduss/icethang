import { StyleSheet, Text, View, Pressable } from 'react-native'

interface MonthlyStatisticsProps {
  year: number
  month: number
  onSelectDate: (date: string) => void
}

// 임시 더미 데이터 (나중에 교체해야 됨!)
const mockConcentration: Record<number, number> = {
  1: 85,
  2: 40,
  3: 90,
  4: 70,
  5: 95,
  6: 60,
  7: 80,
  8: 30,
  9: 88,
  10: 76,
}

const getColorByScore = (score?: number) => {
  if (score === undefined) return '#E0E0E0'

  if (score > 70) return '#2B482C'

  if (score > 30) return '#87A066'

  return '#E6C85C'
}

const MonthlyStatistics = ({ year, month, onSelectDate }: MonthlyStatisticsProps) => {

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']


  return (
    <View style={styles.container}>

      <View style={styles.calendarContainer}>
        {/* 요일 헤더 */}
        <View style={styles.weekRow}>
          {weekDays.map((day) => (
            <Text key={day} style={styles.weekText}>
              {day}
            </Text>
          ))}
        </View>

        {/* 날짜 그리드 */}
        <View style={styles.grid}>
          {Array.from({ length: firstDayOfWeek + daysInMonth }, (_, index) => {
            // 🔹 앞쪽 빈 칸
            if (index < firstDayOfWeek) {
              return (
                <View key={`empty-${index}`} style={styles.dayCell}>
                  <View style={[styles.dayBox, styles.emptyBox]} />
                </View>
              )
            }

            // 🔹 실제 날짜
            const date = index - firstDayOfWeek + 1
            const score = mockConcentration[date]
            const bgColor = getColorByScore(score)

            return (
              <View key={date} style={styles.dayCell}>
                <Pressable
                  style={[styles.dayBox, { backgroundColor: bgColor }]}

                  onPress={() =>
                    onSelectDate(
                      `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
                    )
                  }
                >

                  <Text
                    style={[
                      styles.dayText,
                      score > 70 && styles.highScoreText,]}>
                    {date}
                  </Text>
                </Pressable>
              </View>
            )
          })}
        </View>

        {/* 범례 */}
        <View style={styles.legend}>
          <Text style={styles.legendText}>낮음</Text>

          <View
            style={[
              styles.legendColor,
              { backgroundColor: '#E6C85C' },
            ]}
          />
          <View
            style={[
              styles.legendColor,
              { backgroundColor: '#9DB27C' },
            ]}
          />
          <View
            style={[
              styles.legendColor,
              { backgroundColor: '#4F6F3A' },
            ]}
          />

          <Text style={styles.legendText}>높음</Text>
        </View>
      </View>

    </View>
  )
}

export default MonthlyStatistics

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },

  calendarContainer: {
    borderWidth: 2,
    borderColor: '#3A2E1F',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#F7F3E6',
    marginTop: 12,
  },

  weekRow: {
    flexDirection: 'row',
  },

  weekText: {
    width: '14.28%',
    textAlign: 'center',
    fontWeight: '600',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },

  dayCell: {
    flexBasis: '14.28%',
    paddingHorizontal: 6,
    marginVertical: 8,
  },

  dayBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyBox: {
    backgroundColor: 'transparent',
  },

  dayText: {
    fontWeight: '700',
    color: '#1F2A1F',
  },

  highScoreText: {
    color: '#FFFFFF',
  },

  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },

  legendColor: {
    width: 60,
    height: 10,
    borderRadius: 5,
  },

  legendText: {
    fontSize: 15,
    fontWeight: 600,
    color: '#555',
  },
})
