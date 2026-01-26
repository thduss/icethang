import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'

interface SubjectItem {
  subject: string
  score: number
  color: string
}

const baseSubjectData: Omit<SubjectItem, 'color'>[] = [
  { subject: '국어', score: 95 },
  { subject: '영어', score: 60 },
  { subject: '수학', score: 75 },
  { subject: '과학', score: 88 },
  { subject: '사회', score: 50 },
]

const pieColors = ['#4F6F3A', '#6C8A58', '#7E9B67', '#9DB27C', '#B9C79A']

const subjectData: SubjectItem[] = [...baseSubjectData]
  .sort((a, b) => b.score - a.score)
  .map((item, index) => ({
    ...item,
    color: pieColors[index % pieColors.length],
  }))

const getStatus = (score: number) => {
  if (score >= 90) return '매우 우수'
  if (score >= 85) return '우수'
  if (score >= 80) return '양호'
  if (score >= 70) return '보통'
  return '주의'
}

const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
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

const PieChart = ({ size }: { size: number }) => {
  const total = subjectData.reduce((sum, item) => sum + item.score, 0)
  let startAngle = 0
  const radius = size / 2 - 6

  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={radius} fill={pieColors[pieColors.length - 1]} />
      {subjectData.map((item) => {
        const angle = (item.score / total) * 360
        const endAngle = startAngle + angle
        const overlap = 0
        const adjustedStart = startAngle - overlap / 2
        const adjustedEnd = endAngle + overlap / 2
        const path = describeArc(size / 2, size / 2, radius, adjustedStart, adjustedEnd)
        const slice = <Path key={item.subject} d={path} fill={item.color} />
        startAngle = endAngle
        return slice
      })}
      <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#3A2E1F" strokeWidth={2} />
    </Svg>
  )
}

const PieLabels = ({ size }: { size: number }) => {
  const total = subjectData.reduce((sum, item) => sum + item.score, 0)
  const center = size / 2
  const labelRadius = center
  let startAngle = 0

  return (
    <>
      {subjectData.map((item) => {
        const angle = (item.score / total) * 360
        const endAngle = startAngle + angle
        const midAngle = startAngle + angle / 2
        const point = polarToCartesian(center, center, labelRadius, midAngle)
        const label = (
          <Text
            key={item.subject}
            style={[
              styles.pieLabel,
              {
                left: point.x,
                top: point.y,
              },
            ]}
          >
            {item.subject} ({item.score}%)
          </Text>
        )
        startAngle = endAngle
        return label
      })}
    </>
  )
}

const SubjectStatistics = () => {
  const best = subjectData.reduce((top, cur) => (cur.score > top.score ? cur : top))
  const average = Math.round(
    subjectData.reduce((sum, item) => sum + item.score, 0) / subjectData.length
  )

  return (
    <View style={styles.container}>
      <View style={styles.sectionRow}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>과목별 집중도 분포</Text>
          <View style={styles.chartRow}>
            <View style={styles.chartArea}>
              <View style={styles.chartWrapper}>
                <PieChart size={170} />
              </View>
              <View pointerEvents="none" style={styles.labelLayer}>
                <PieLabels size={220} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>과목별 상세 집중도</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>과목</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>집중도 (%)</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>상태</Text>
            </View>
            {subjectData.map((item) => (
              <View key={item.subject} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.subject}</Text>
                <Text style={styles.tableCell}>{item.score}%</Text>
                <Text style={styles.tableCell}>{getStatus(item.score)}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            최고 과목: {best.subject} ({best.score}%)
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>평균 집중도: {average}%</Text>
        </View>
      </View>
    </View>
  )
}

export default SubjectStatistics

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    paddingVertical: 8,
  },

  sectionRow: {
    flexDirection: 'row',
    gap: 16,
  },

  card: {
    flex: 1,
    backgroundColor: '#F7F3E6',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#3A2E1F',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3A2E1F',
    textAlign: 'center',
    marginBottom: 12,
  },

  chartRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  chartArea: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
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
  },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFFDF7',
    borderBottomWidth: 1,
    borderBottomColor: '#3A2E1F',
  },

  tableHeader: {
    backgroundColor: '#D8CFAF',
  },

  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#3A2E1F',
  },

  tableHeaderText: {
    fontWeight: '700',
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 16,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#F7F3E6',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#3A2E1F',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3A2E1F',
  },
})
