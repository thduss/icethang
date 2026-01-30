import { useMemo, useState } from 'react'
import { StyleSheet, Text, View, Pressable } from 'react-native'

interface MonthlyStatisticsProps {
  year: number
  month: number
  onSelectDate: (date: string) => void
}

// 임시 데이터(추후 API 연동 필요)
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

const GRID_GAP = 6
const CALENDAR_PADDING = 12
const WEEK_ROW_MARGIN_BOTTOM = 12
const LEGEND_MARGIN_TOP = 27

const MonthlyStatistics = ({ year, month, onSelectDate }: MonthlyStatisticsProps) => {
  const [gridWidth, setGridWidth] = useState(0)

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']
  const totalCells = 42
  const rowCount = 6

  const cellSize = useMemo(() => {
    if (!gridWidth) return 0
    return Math.floor((gridWidth - GRID_GAP * 6) / 7)
  }, [gridWidth])

  return (
    <View style={styles.container}>
      <View
        style={styles.calendarContainer}
      >
        {/* 요일 헤더 */}
        <View
          style={[styles.weekRow, cellSize ? { gap: GRID_GAP } : null]}
        >
          {weekDays.map((day) => (
            <Text
              key={day}
              style={[styles.weekText, cellSize ? { width: cellSize } : null]}
            >
              {day}
            </Text>
          ))}
        </View>

        {/* 날짜 그리드 */}
        <View
          style={[styles.grid, cellSize ? { gap: GRID_GAP } : null]}
          onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}
        >
          {Array.from({ length: totalCells }, (_, index) => {
            const date = index - firstDayOfWeek + 1
            const isValidDate = date >= 1 && date <= daysInMonth

            if (!isValidDate) {
              return (
                <View
                  key={`empty-${index}`}
                  style={[styles.dayCell, cellSize ? { width: cellSize, height: cellSize } : null]}
                >
                  <View
                    style={[
                      styles.dayBox,
                      styles.emptyBox,
                      cellSize ? { borderRadius: Math.round(cellSize * 0.25) } : null,
                    ]}
                  />
                </View>
              )
            }

            const score = mockConcentration[date]
            const bgColor = getColorByScore(score)

            return (
              <View
                key={date}
                style={[styles.dayCell, cellSize ? { width: cellSize, height: cellSize } : null]}
              >
                <Pressable
                  style={[
                    styles.dayBox,
                    { backgroundColor: bgColor },
                    cellSize ? { borderRadius: Math.round(cellSize * 0.25) } : null,
                  ]}
                  onPress={() =>
                    onSelectDate(
                      `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
                    )
                  }
                >
                  <Text style={[styles.dayText, score > 70 && styles.highScoreText]}>
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
          <View style={[styles.legendColor, { backgroundColor: '#E6C85C' }]} />
          <View style={[styles.legendColor, { backgroundColor: '#9DB27C' }]} />
          <View style={[styles.legendColor, { backgroundColor: '#4F6F3A' }]} />
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
    paddingBottom: 10,
    alignItems: 'center',
    width: '100%',
    flexGrow: 1,
    flex: 1,
  },

  calendarContainer: {
    borderWidth: 2,
    borderColor: '#3A2E1F',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F7F3E6',
    marginTop: 12,
    width: '100%',
    alignSelf: 'stretch',
    flexGrow: 1,
    flex: 1,
  },

  weekRow: {
    flexDirection: 'row',
    marginBottom: WEEK_ROW_MARGIN_BOTTOM,
    justifyContent: 'flex-start',
  },

  weekText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },

  dayCell: {
    padding: 16,
    marginBottom: -93,
  },

  dayBox: {
    width: '90%',
    height: '40%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyBox: {
    backgroundColor: '#D9D9D9',
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
    gap: 20,
    marginTop: LEGEND_MARGIN_TOP,
  },

  legendColor: {
    width: 50,
    height: 10,
    borderRadius: 5,
  },

  legendText: {
    fontSize: 15,
    fontWeight: 600,
    color: '#555',
  },
})
