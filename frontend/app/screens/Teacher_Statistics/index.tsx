import { StyleSheet, Text, View } from 'react-native'
import { useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import LeftSidebar from '../../components/menu/LeftSidebar'
import BackButton from 'app/components/menu/BackButton'
import StatisticsHeader from '../../components/menu/StatisticsHeader'
import StatisticsTabs from 'app/components/menu/StatisticsTabs'
import StatisticsFilter from 'app/components/menu/StatisticsFilter'
import StatisticsSummary from 'app/components/menu/StatisticsSummary'
import MonthlyStatistics from './MonthlyStatistics'
import StatisticsBorder from 'app/components/menu/StatisticsBorder'

type ViewType = 'monthly' | 'weekly' | 'subject'

const index = () => {

  const { name, number } = useLocalSearchParams<{
    name: string
    number: string
  }>()

  const [view, setView] = useState<ViewType>('monthly')
  const [year, setYear] = useState(2025)
  const [month, setMonth] = useState(11)

  return (
    <View style={styles.container}>
      <LeftSidebar />

      <View style={styles.content}>
        <StatisticsHeader
          name={name}
          number={Number(number)}
        />

        <StatisticsTabs
          value={view}
          onChange={setView}
        />

        {view === 'monthly' && (
          <StatisticsBorder>

            <StatisticsFilter
              year={year}
              month={month}
              onPressYear={() => {
                // 나중에 연도 선택 드롭바
                console.log('연도 선택')
              }}
              onPressMonth={() => {
                // 나중에 월 선택 드롭바
                console.log('월 선택')
              }}
              onPressExp={() => {
                // 나중에 경험치 관리 모달 추가
                console.log('경험치 관리 선택')
              }}
            />

            {view === 'monthly' && (
              <MonthlyStatistics
                year={year}
                month={month}
                onSelectDate={(date) => {
                  console.log('선택한 날짜:', date)
                  // 여기서 나중에 daily 화면으로 전환함
                }}
              />
            )}

            <StatisticsSummary
              left={{ label: '월간 평균', value: '80%' }}
              right={{ label: '가장 집중한 주', value: '3주차' }}
            />
          </StatisticsBorder>
        )}
      </View>
    </View>
  )
}

export default index

const styles = StyleSheet.create({

  container: {
    flexDirection: "row",
    backgroundColor: "#F3EED4",
    flex: 1,
  },

  content: {
    flex: 1,
    padding: 16,
  },
})