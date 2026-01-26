import { StyleSheet, Text, View, Pressable } from 'react-native'

interface WeekRange {
  start: Date
  end: Date
}

interface WeeklyStatisticsProps {
  weekRange: WeekRange | null
  onPressCalendar: () => void
}

/** 임시 데이터 (나중에 API 데이터로 교체) */
const WEEKLY_DATA = [
  { day: '월', value: 80 },
  { day: '화', value: 65 },
  { day: '수', value: 85 },
  { day: '목', value: 95 },
  { day: '금', value: 88 },
]

const WeeklyStatistics = ({
  weekRange,
  onPressCalendar,
}: WeeklyStatisticsProps) => {


  const average =
    WEEKLY_DATA.reduce((sum, d) => sum + d.value, 0) /
    WEEKLY_DATA.length

  const bestDay = WEEKLY_DATA.reduce((prev, curr) =>
    curr.value > prev.value ? curr : prev
  )


  return (
    <View style={styles.wrapper}>
      {/* ───── 상단 헤더 ───── */}
      <View style={styles.header}>
        <View style={styles.titleRow}>

          <Text style={styles.headerText}>
            {weekRange
              ? `주간 추세: ${formatDate(weekRange.start)} - ${formatDate(weekRange.end)}`
              : '날짜를 선택해주세요'}
          </Text>

          <Pressable onPress={onPressCalendar}>
            <Text style={styles.calendarIcon}>📅</Text>
          </Pressable>
        </View>
      </View>

      {!weekRange && (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            달력 아이콘을 눌러 날짜를 선택하세요
          </Text>
        </View>
      )}

      {weekRange && (
        <>
          {/* 그래프 카드 */}
          <View style={styles.chartCard}>
            <View style={styles.chart}>
              {WEEKLY_DATA.map((item) => (
                <View key={item.day} style={styles.barWrap}>
                  <Text style={styles.percentText}>{item.value}%</Text>

                  <View
                    style={[
                      styles.bar,
                      { height: item.value },
                    ]}
                  />

                  <Text style={styles.dayLabel}>
                    {item.day}({item.value}%)
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 요약 카드 */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>주간 평균</Text>
              <Text style={styles.summaryValue}>
                {average.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>최고 요일</Text>
              <Text style={styles.summaryValue}>
                {bestDay.day}요일({bestDay.value}%)
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
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },

  calendarIcon: {
    fontSize: 20,
  },

  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },

  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },

  barWrap: {
    alignItems: 'center',
    width: 48,
  },

  percentText: {
    fontSize: 15,
    marginBottom: 8,
    fontWeight: '600',
  },

  bar: {
    width: 50,
    backgroundColor: '#5E79A8',
    borderRadius: 2,
  },

  dayLabel: {
    fontSize: 12,
    marginTop: 6,
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
