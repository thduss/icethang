import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { WeeklyStat } from 'app/store/slices/statisticsSlice'

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'] as const

interface WeekRange {
  start: Date
  end: Date
}

interface WeeklyStatisticsProps {
  weekRange: WeekRange | null
  onPressCalendar?: () => void
  data: WeeklyStat[]
}

interface NormalizedWeeklyStat {
  dayOfWeek: (typeof WEEKDAYS)[number]
  averageFocusRate: number
}

const mapDayToKorean = (day: string) => {
  const dayMap: Record<string, string> = {
    MON: '월',
    TUE: '화',
    WED: '수',
    THU: '목',
    FRI: '금',
  }
  return dayMap[day] || day
}

const clampPercentage = (value: number) => Math.min(100, Math.max(0, value))

const normalizeWeekdayData = (data: WeeklyStat[]): NormalizedWeeklyStat[] =>
  WEEKDAYS.map((day) => {
    const found = data.find((item) => item.dayOfWeek === day)
    return {
      dayOfWeek: day,
      averageFocusRate: clampPercentage(Number(found?.averageFocusRate ?? 0)),
    }
  })

const WeeklyStatistics = ({ weekRange, onPressCalendar, data }: WeeklyStatisticsProps) => {
  const { width } = useWindowDimensions()
  const isCompact = width < 900
  const chartHeight = Math.max(120, Math.min(180, width * 0.16))
  const barWidth = Math.max(16, Math.min(44, width * 0.036))
  const titleFontSize = Math.max(18, Math.min(26, width * 0.026))
  const percentFontSize = Math.max(16, Math.min(22, width * 0.021))
  const dayFontSize = Math.max(18, Math.min(28, width * 0.026))
  const chartContentHeight = chartHeight + percentFontSize + dayFontSize + 28

  const weekdayData = useMemo(() => normalizeWeekdayData(data), [data])
  const average =
    weekdayData.length > 0
      ? weekdayData.reduce((sum, d) => sum + d.averageFocusRate, 0) / weekdayData.length
      : 0

  const bestDay = useMemo(() => {
    if (weekdayData.length === 0) return null
    const result = weekdayData.reduce((prev, curr) =>
      curr.averageFocusRate > prev.averageFocusRate ? curr : prev
    )
    return result.averageFocusRate > 0 ? result : null
  }, [weekdayData])

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.headerText, { fontSize: titleFontSize }]}>
            {weekRange
              ? `주간 추세: ${formatDate(weekRange.start)} - ${formatDate(weekRange.end)}`
              : '날짜를 선택해주세요'}
          </Text>

          {onPressCalendar && (
            <Pressable onPress={onPressCalendar}>
              <Text style={[styles.calendarIcon, { fontSize: titleFontSize + 2 }]}>📅</Text>
            </Pressable>
          )}
        </View>
      </View>

      {!weekRange ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>달력 아이콘을 눌러 날짜를 선택하세요</Text>
        </View>
      ) : (
        <>
          <View style={[styles.chartCard, { paddingHorizontal: isCompact ? 8 : 14 }]}>
            <View style={[styles.chart, { height: chartContentHeight }]}>
              {weekdayData.map((item) => (
                <View key={item.dayOfWeek} style={styles.barWrap}>
                  <Text style={[styles.percentText, { fontSize: percentFontSize }]}>
                    {item.averageFocusRate.toFixed(0)}%
                  </Text>

                  <View style={[styles.barContainer, { height: chartHeight }]}>
                    <View
                      style={[
                        styles.bar,
                        {
                          width: barWidth,
                          height: item.averageFocusRate > 0 ? (item.averageFocusRate / 100) * chartHeight : 2,
                          backgroundColor: item.averageFocusRate >= 70 ? '#5E79A8' : '#A89B5E',
                        },
                      ]}
                    />
                  </View>

                  <Text style={[styles.dayLabel, { fontSize: dayFontSize }]}>
                    {mapDayToKorean(item.dayOfWeek)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>주간 평균</Text>
              <Text style={styles.summaryValue}>{average.toFixed(1)}%</Text>
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>최고 요일</Text>
              <Text style={styles.summaryValue}>
                {bestDay
                  ? `${mapDayToKorean(bestDay.dayOfWeek)}요일(${bestDay.averageFocusRate.toFixed(1)}%)`
                  : '-'}
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  )
}

export default WeeklyStatistics

const formatDate = (date: Date) => {
  const m = date.getMonth() + 1
  const d = date.getDate()
  return `${m}월 ${d}일`
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 8,
  },
  emptyWrap: {
    alignItems: 'center',
    marginVertical: 32,
  },
  emptyText: {
    color: '#999',
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  calendarIcon: {
    lineHeight: 32,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  barContainer: {
    justifyContent: 'flex-end',
  },
  percentText: {
    marginBottom: 6,
    fontWeight: '600',
  },
  bar: {
    borderRadius: 4,
  },
  dayLabel: {
    marginTop: 8,
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: '#F6F3DC',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#555',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
})
