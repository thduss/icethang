import React, { useMemo } from 'react'
import { StyleSheet, Text, View, ScrollView } from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'
import { SubjectStat } from 'app/store/slices/statisticsSlice'

interface SubjectItem extends SubjectStat {
  color: string
}

interface SubjectStatisticsProps {
  data: SubjectStat[]
}

const pieColors = ['#4F6F3A', '#6C8A58', '#7E9B67', '#9DB27C', '#B9C79A']

const getStatus = (score: number) => {
  if (score >= 90) return '매우 우수'
  if (score >= 85) return '우수'
  if (score >= 80) return '양호'
  if (score >= 70) return '보통'
  return '주의'
}

const polarToCartesian = (
  cx: number,
  cy: number,
  r: number,
  angle: number
) => {
  const rad = ((angle - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

const describeArc = (
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) => {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

const PieChart = ({ data, size }: { data: SubjectItem[]; size: number }) => {
  const total = data.reduce((sum, item) => sum + item.avgFocusRate, 0)
  let startAngle = 0
  const radius = size / 2 - 6

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill={pieColors[pieColors.length - 1]}
      />
      {data.map((item) => {
        if (total === 0) return null
        const angle = (item.avgFocusRate / total) * 360
        const endAngle = startAngle + angle
        const path = describeArc(
          size / 2,
          size / 2,
          radius,
          startAngle,
          endAngle
        )
        startAngle = endAngle
        return <Path key={item.subject} d={path} fill={item.color} />
      })}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#3A2E1F"
        strokeWidth={2}
      />
    </Svg>
  )
}

const PieLabels = ({ data, size }: { data: SubjectItem[]; size: number }) => {
  const total = data.reduce((sum, item) => sum + item.avgFocusRate, 0)
  const center = size / 2
  const labelRadius = center
  let startAngle = 0

  return (
    <>
      {data.map((item) => {
        if (total === 0) return null
        const angle = (item.avgFocusRate / total) * 360
        const endAngle = startAngle + angle
        const midAngle = startAngle + angle / 2
        const point = polarToCartesian(
          center,
          center,
          labelRadius,
          midAngle
        )
        startAngle = endAngle

        return (
          <Text
            key={item.subject}
            style={[
              styles.pieLabel,
              { left: point.x, top: point.y },
            ]}
          >
            {item.subject}
          </Text>
        )
      })}
    </>
  )
}

const SubjectStatistics = ({ data }: SubjectStatisticsProps) => {
  const processedData = useMemo(() => {
    return [...data]
      .sort((a, b) => b.avgFocusRate - a.avgFocusRate)
      .map((item, index) => ({
        ...item,
        color: pieColors[index % pieColors.length],
      }))
  }, [data])

  const best = processedData[0] ?? null
  const average =
    processedData.length > 0
      ? Math.round(
          processedData.reduce(
            (sum, item) => sum + item.avgFocusRate,
            0
          ) / processedData.length
        )
      : 0

  if (data.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.summaryText}>과목별 데이터가 없습니다.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionRow}>
        {/* 차트 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>과목별 집중도 분포</Text>
          <View style={styles.chartArea}>
            <View style={styles.chartWrapper}>
              <PieChart data={processedData} size={170} />
            </View>
            <View pointerEvents="none" style={styles.labelLayer}>
              <PieLabels data={processedData} size={220} />
            </View>
          </View>
        </View>

        {/* 테이블 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>과목별 상세 리포트</Text>

          <View style={styles.table}>
            {/* 고정 헤더 */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>
                과목
              </Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>
                집중도
              </Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>
                이탈
              </Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>
                상태
              </Text>
            </View>

            {/* 스크롤 바디 */}
            <ScrollView
              style={styles.tableScroll}
              contentContainerStyle={styles.tableScrollContent}
              showsVerticalScrollIndicator={true}
              indicatorStyle="black" 
            >
              {processedData.map((item, index) => (
                <View
                  key={item.subject}
                  style={[
                    styles.tableRow,
                    index === processedData.length - 1 && {
                      borderBottomWidth: 0,
                    },
                  ]}
                >
                  <Text style={styles.tableCell}>{item.subject}</Text>
                  <Text style={styles.tableCell}>
                    {item.avgFocusRate.toFixed(1)}%
                  </Text>
                  <Text style={styles.tableCell}>
                    {item.avgOutOfSeat}회
                  </Text>
                  <Text style={styles.tableCell}>
                    {getStatus(item.avgFocusRate)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            최고 과목:{' '}
            {best ? `${best.subject} (${best.avgFocusRate}%)` : '-'}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            전체 평균 집중도: {average}%
          </Text>
        </View>
      </View>
    </View>
  )
}

export default SubjectStatistics

const styles = StyleSheet.create({
  container: { flex: 1, gap: 16, paddingVertical: 8 },
  center: { justifyContent: 'center', alignItems: 'center' },

  sectionRow: { flexDirection: 'row', gap: 16 },

  card: {
    flex: 1,
    backgroundColor: '#F7F3E6',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#3A2E1F',
    padding: 16,
    height: 460,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3A2E1F',
    textAlign: 'center',
    marginBottom: 12,
  },

  chartArea: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },

  chartWrapper: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#FFFDF7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  labelLayer: {
    position: 'absolute',
    width: 220,
    height: 220,
  },

  pieLabel: {
    position: 'absolute',
    width: 90,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#3A2E1F',
    transform: [{ translateX: -45 }, { translateY: -10 }],
  },

  table: {
    borderWidth: 1,
    borderColor: '#3A2E1F',
    borderRadius: 10,
    overflow: 'hidden',
    height: 380,
  },

  tableScroll: { flex: 1 },

  tableScrollContent: { paddingBottom: 4 },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFFDF7',
    borderBottomWidth: 1,
    borderBottomColor: '#3A2E1F',
  },

  tableHeader: { backgroundColor: '#D8CFAF' },

  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#3A2E1F',
  },

  tableHeaderText: { fontWeight: '700' },

  summaryRow: { flexDirection: 'row', gap: 16 },

  summaryCard: {
    flex: 1,
    backgroundColor: '#F7F3E6',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#3A2E1F',
    paddingVertical: 12,
    alignItems: 'center',
  },

  summaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3A2E1F',
  },
})
