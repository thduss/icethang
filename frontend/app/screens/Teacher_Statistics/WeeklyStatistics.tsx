import { StyleSheet, Text, View, Pressable } from 'react-native'
import { WeeklyStat } from 'app/store/slices/statisticsSlice'

interface WeekRange {
  start: Date
  end: Date
}

interface WeeklyStatisticsProps {
  weekRange: WeekRange | null
  onPressCalendar: () => void
  data: WeeklyStat[]
}

// 요일 변환 헬퍼 함수
const mapDayToKorean = (day: string) => {
  const dayMap: Record<string, string> = {
    'MON': '월', 'TUE': '화', 'WED': '수', 'THU': '목', 'FRI': '금', 'SAT': '토', 'SUN': '일'
  }
  return dayMap[day] || day
}

const WeeklyStatistics = ({
  weekRange,
  onPressCalendar,
  data,
}: WeeklyStatisticsProps) => {

  const average = data.length > 0
    ? data.reduce((sum, d) => sum + d.averageFocusRate, 0) / data.length
    : 0

  const bestDay = data.length > 0
    ? data.reduce((prev, curr) => curr.averageFocusRate > prev.averageFocusRate ? curr : prev)
    : null

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

      {!weekRange || data.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            {!weekRange ? '달력 아이콘을 눌러 날짜를 선택하세요' : '데이터를 불러오는 중입니다...'}
          </Text>
        </View>
      ) : (
        <>
          {/* 그래프 카드 */}
          <View style={styles.chartCard}>
            <View style={styles.chart}>
              {data.map((item) => (
                <View key={item.date} style={styles.barWrap}>
                  <Text style={styles.percentText}>{item.averageFocusRate.toFixed(0)}%</Text>

                  <View
                    style={[
                      styles.bar,
                      { 
                        // 집중도가 0이면 아주 얇게라도 표시하거나 0px 처리
                        height: item.averageFocusRate > 0 ? item.averageFocusRate * 1.2 : 2, 
                        backgroundColor: item.averageFocusRate > 70 ? '#5E79A8' : '#A89B5E' 
                      },
                    ]}
                  />

                  <Text style={styles.dayLabel}>
                    {mapDayToKorean(item.dayOfWeek)}
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
                {bestDay ? `${mapDayToKorean(bestDay.dayOfWeek)}요일(${bestDay.averageFocusRate.toFixed(1)}%)` : '-'}
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
  wrapper: { marginTop: 8 },
  emptyWrap: { alignItems: 'center', marginVertical: 32 },
  emptyText: { color: '#999' },
  header: { alignItems: 'center', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerText: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  calendarIcon: { fontSize: 20 },
  chartCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#DDD' },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160 },
  barWrap: { alignItems: 'center', width: 42 },
  percentText: { fontSize: 12, marginBottom: 8, fontWeight: '600' },
  bar: { width: 30, backgroundColor: '#5E79A8', borderRadius: 4 },
  dayLabel: { fontSize: 12, marginTop: 6 },
  summaryRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  summaryBox: { flex: 1, backgroundColor: '#F6F3DC', borderRadius: 16, padding: 16, alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: '#555' },
  summaryValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
})