import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MonthlyStat } from 'app/store/slices/statisticsSlice'

interface MonthlyStatisticsProps {
  year: number
  month: number
  data: MonthlyStat[]
  onSelectDate: (date: string) => void
}

interface GridLayout {
  width: number
  height: number
}

const getColorByScore = (score?: number) => {
  if (score === undefined || score === 0) return '#E0E0E0'
  if (score > 70) return '#2B482C'
  if (score > 30) return '#87A066'
  return '#E6C85C'
}

const MonthlyStatistics = ({ year, month, data, onSelectDate }: MonthlyStatisticsProps) => {
  const [gridLayout, setGridLayout] = useState<GridLayout>({ width: 0, height: 0 })

  const focusMap = useMemo(() => {
    const map: Record<string, number> = {}
    data.forEach((item) => {
      map[item.date] = item.averageFocusRate
    })
    return map
  }, [data])

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const weekDays = ['\uC77C', '\uC6D4', '\uD654', '\uC218', '\uBAA9', '\uAE08', '\uD1A0']
  const usedCells = firstDayOfWeek + daysInMonth
  const weekCount = Math.ceil(usedCells / 7)
  const totalCells = weekCount * 7

  const layout = useMemo(() => {
    const width = gridLayout.width
    const height = gridLayout.height

    if (!width) {
      return {
        gap: 6,
        cellWidth: 0,
        cellHeight: 0,
        pillWidth: 0,
        pillHeight: 0,
        dayFontSize: 16,
        weekFontSize: 18,
      }
    }

    const gap = Math.max(4, Math.min(10, Math.floor(width * 0.01)))
    const cellWidth = Math.max(30, Math.floor((width - gap * 6) / 7))
    const maxCellHeight = height > 0 ? Math.floor((height - gap * (weekCount - 1)) / weekCount) : cellWidth
    const cellHeight = Math.max(30, Math.min(cellWidth, maxCellHeight))
    const pillBase = Math.min(cellWidth, cellHeight)
    const pillWidth = Math.round(Math.min(cellWidth * 0.86, pillBase * 0.86))
    const pillHeight = Math.max(20, Math.min(46, Math.round(pillBase * 0.52)))

    return {
      gap,
      cellWidth,
      cellHeight,
      pillWidth,
      pillHeight,
      dayFontSize: Math.max(14, Math.min(30, Math.round(pillBase * 0.34))),
      weekFontSize: Math.max(15, Math.min(28, Math.round(cellWidth * 0.34))),
    }
  }, [gridLayout.height, gridLayout.width, weekCount])

  return (
    <View style={styles.container}>
      <View style={styles.calendarContainer}>
        <View style={[styles.weekRow, layout.cellWidth ? { gap: layout.gap } : null]}>
          {weekDays.map((day) => (
            <Text
              key={day}
              style={[
                styles.weekText,
                layout.cellWidth
                  ? {
                      width: layout.cellWidth,
                      fontSize: layout.weekFontSize,
                    }
                  : null,
              ]}
            >
              {day}
            </Text>
          ))}
        </View>

        <View
          style={[styles.grid, layout.cellWidth ? { gap: layout.gap } : null]}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout
            setGridLayout({ width, height })
          }}
        >
          {Array.from({ length: totalCells }, (_, index) => {
            const date = index - firstDayOfWeek + 1
            const isValidDate = date >= 1 && date <= daysInMonth

            if (!isValidDate) {
              return (
                <View
                  key={`empty-${index}`}
                  style={[
                    styles.dayCell,
                    layout.cellWidth
                      ? { width: layout.cellWidth, height: layout.cellHeight }
                      : null,
                  ]}
                >
                  <View
                    style={[
                      styles.dayBox,
                      styles.emptyBox,
                      layout.cellWidth
                        ? {
                            width: layout.pillWidth,
                            height: layout.pillHeight,
                            borderRadius: Math.round(layout.pillHeight / 2),
                          }
                        : null,
                    ]}
                  />
                </View>
              )
            }

            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
            const score = focusMap[dateStr]
            const bgColor = getColorByScore(score)

            return (
              <View
                key={date}
                style={[
                  styles.dayCell,
                  layout.cellWidth
                    ? { width: layout.cellWidth, height: layout.cellHeight }
                    : null,
                ]}
              >
                <Pressable
                  style={[
                    styles.dayBox,
                    { backgroundColor: bgColor },
                    layout.cellWidth
                      ? {
                          width: layout.pillWidth,
                          height: layout.pillHeight,
                          borderRadius: Math.round(layout.pillHeight / 2),
                        }
                      : null,
                  ]}
                  onPress={() => onSelectDate(dateStr)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      layout.cellWidth ? { fontSize: layout.dayFontSize } : null,
                      score > 70 && styles.highScoreText,
                    ]}
                  >
                    {date}
                  </Text>
                </Pressable>
              </View>
            )
          })}
        </View>

        <View style={styles.legend}>
          <Text style={styles.legendText}>{'\uB0AE\uC74C'}</Text>
          <View style={[styles.legendColor, { backgroundColor: '#E6C85C' }]} />
          <View style={[styles.legendColor, { backgroundColor: '#9DB27C' }]} />
          <View style={[styles.legendColor, { backgroundColor: '#4F6F3A' }]} />
          <Text style={styles.legendText}>{'\uB192\uC74C'}</Text>
        </View>
      </View>
    </View>
  )
}

export default MonthlyStatistics

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingBottom: 10,
    minHeight: 0,
  },
  calendarContainer: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#3A2E1F',
    borderRadius: 16,
    backgroundColor: '#F7F3E6',
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 0,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  weekText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#1F1F1F',
  },
  grid: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
  },
  dayCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBox: {
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
    marginTop: 10,
    paddingBottom: 2,
  },
  legendColor: {
    width: 50,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
})
