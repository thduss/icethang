import { StyleSheet, Text, View } from 'react-native'
import { useState } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import LeftSidebar from '../../components/menu/LeftSidebar'
import BackButton from 'app/components/menu/BackButton'
import StatisticsHeader from '../../components/menu/StatisticsHeader'
import StatisticsTabs from 'app/components/menu/StatisticsTabs'
import StatisticsFilter from 'app/components/menu/StatisticsFilter'
import StatisticsSummary from 'app/components/menu/StatisticsSummary'
import MonthlyStatistics from './MonthlyStatistics'
import StatisticsBorder from 'app/components/menu/StatisticsBorder'
import DailyStatistics from './DailyStatistics'

type ViewType = 'monthly' | 'weekly' | 'subject' | 'daily'
const index = () => {

  const { name, number } = useLocalSearchParams<{
    name: string
    number: string
  }>()

  const [view, setView] = useState<ViewType>('monthly')
  const [year, setYear] = useState(2025)
  const [month, setMonth] = useState(11)
  const [selectedDate, setSelectedDate] = useState<string>('')

  const handleBack = () => {
    if (view === 'daily') {
      setView('monthly')
    } else {
      router.back()
    }
  }

  const handleTagChange = (newView: ViewType) => {
    setView(newView)
  }

  return (
    <View style={styles.container}>
      <LeftSidebar />

      <View style={styles.content}>
        <StatisticsHeader
          name={name}
          number={Number(number)}
          onBack={handleBack}
        />

        <StatisticsTabs
          value={view === 'daily' ? 'monthly' : view}
          onChange={handleTagChange}
        />

        <StatisticsBorder>
          {/* 1. 월별 보기 (monthly) */}
          {view === 'monthly' && (
            <>
              <StatisticsFilter
                year={year}
                month={month}
                onPressYear={() => console.log('연도')}
                onPressMonth={() => console.log('월')}
                onPressExp={() => console.log('경험치')}
              />
              <MonthlyStatistics
                year={year}
                month={month}
                onSelectDate={(date) => {
                  setSelectedDate(date)
                  setView('daily') // 날짜 선택 시 Daily 뷰로 전환
                }}
              />
              <StatisticsSummary
                left={{ label: '월간 평균', value: '80%' }}
                right={{ label: '가장 집중한 주', value: '3주차' }}
              />
            </>
          )}

          {/* 2. 일별 상세 보기 (daily) - 여기에 구현! */}
          {view === 'daily' && (
            <DailyStatistics
              date={selectedDate}
              onBack={() => setView('monthly')}
            />
          )}

          {/* 주별, 과목별 보기는 추후 구현 */}
        </StatisticsBorder>
      </View>
    </View>
  )
}

export default index

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F3EED4',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
})