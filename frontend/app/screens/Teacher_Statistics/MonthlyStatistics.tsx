import { useMemo, useState } from 'react'
import { StyleSheet, Text, View, Pressable } from 'react-native'
import { MonthlyStat } from 'app/store/slices/statisticsSlice'

interface MonthlyStatisticsProps {
  year: number
  month: number
  data: MonthlyStat[]
  onSelectDate: (date: string) => void
}

const getColorByScore = (score?: number) => {
  if (score === undefined || score === 0) return '#E0E0E0'
  if (score > 70) return '#2B482C'
  if (score > 30) return '#87A066'
  return '#E6C85C'
}

const GRID_GAP = 6
const WEEK_ROW_MARGIN_BOTTOM = 12
const LEGEND_MARGIN_TOP = 27

const MonthlyStatistics = ({ year, month, data, onSelectDate }: MonthlyStatisticsProps) => {
  const [gridWidth, setGridWidth] = useState(0)

  // API의 배열 데이터를 { "2026-01-01": 78.5 } 형태의 객체로 변환하여 검색 속도 최적화
  const focusMap = useMemo(() => {
    const map: Record<string, number> = {}
    data.forEach((item) => {
      map[item.date] = item.averageFocusRate
    })
    return map
  }, [data])

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']
  const totalCells = 42

  const cellSize = useMemo(() => {
    if (!gridWidth) return 0
    return Math.floor((gridWidth - GRID_GAP * 6) / 7)
  }, [gridWidth])

  return (
    <View style={styles.container}>
      <View style={styles.calendarContainer}>
        {/* 요일 헤더 */}
        <View style={[styles.weekRow, cellSize ? { gap: GRID_GAP } : null]}>
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

            // 현재 날짜 키 생성 (API 규격: yyyy-MM-dd)
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
            const score = focusMap[dateStr]
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
                  onPress={() => onSelectDate(dateStr)}
                >
                  <Text style={[styles.dayText, score > 70 && styles.highScoreText]}>
                    {date}
                  </Text>
                </Pressable>
              </View>
            )
          })}
        </View>

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
  container: { paddingBottom: 10, alignItems: 'center', width: '100%', flexGrow: 1, flex: 1 },
  calendarContainer: {
    borderWidth: 2, borderColor: '#3A2E1F', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 12,
    backgroundColor: '#F7F3E6', marginTop: 12, width: '100%', alignSelf: 'stretch', flexGrow: 1, flex: 1,
  },
  weekRow: { flexDirection: 'row', marginBottom: WEEK_ROW_MARGIN_BOTTOM, justifyContent: 'flex-start' },
  weekText: { textAlign: 'center', fontWeight: '600', fontSize: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  dayCell: { padding: 17, marginBottom: -88 },
  dayBox: { width: '90%', height: '40%', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  emptyBox: { backgroundColor: '#D9D9D9' },
  dayText: { fontWeight: '700', color: '#1F2A1F' },
  highScoreText: { color: '#FFFFFF' },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: LEGEND_MARGIN_TOP },
  legendColor: { width: 50, height: 10, borderRadius: 5 },
  legendText: { fontSize: 15, fontWeight: '600', color: '#555' },
})