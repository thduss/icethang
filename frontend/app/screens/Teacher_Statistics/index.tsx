import { StyleSheet, Text, View } from 'react-native'
import { useState, useEffect } from 'react'
import { useLocalSearchParams, router } from 'expo-router'

import LeftSidebar from '../../components/Menu/LeftSidebar'
import StatisticsHeader from '../../components/Menu/StatisticsHeader'
import StatisticsTabs, { ViewType } from 'app/components/Menu/StatisticsTabs'
import StatisticsFilter from 'app/components/Menu/StatisticsFilter'
import StatisticsSummary from 'app/components/Menu/StatisticsSummary'
import StatisticsBorder from 'app/components/Menu/StatisticsBorder'

import DailyStatistics from './DailyStatistics'
import MonthlyStatistics from './MonthlyStatistics'
import WeeklyStatistics from './WeeklyStatistics'
import WeeklyCalendar from './WeeklyCalendar'
import ExpModal from './ExpModal'
import SubjectStatistics from './SubjectStatistics'

type StatisticsView = ViewType | 'daily'

const index = () => {
  const { name, number } = useLocalSearchParams<{
    name: string
    number: string
  }>()

  const [view, setView] = useState<ViewType | 'daily'>('monthly')
  const [year, setYear] = useState(2025)
  const [month, setMonth] = useState(11)

  const [isExpModalVisible, setExpModalVisible] = useState(false)

  const [calendarVisible, setCalendarVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedWeek, setSelectedWeek] = useState<{
    start: Date
    end: Date
  } | null>(null)

  const handleBack = () => {
    if (view === 'daily') {
      setView('monthly')
    } else {
      router.back()
    }
  }

  const handleTabChange = (newView: ViewType) => {
    setView(newView)
  }

  const getWeekFromDate = (date: Date) => {
    const day = date.getDay()
    const mondayOffset = day === 0 ? -6 : 1 - day

    const start = new Date(date)
    start.setDate(date.getDate() + mondayOffset)

    const end = new Date(start)
    end.setDate(start.getDate() + 4)

    return { start, end }
  }

  useEffect(() => {
    if (view === 'weekly' && !selectedWeek) {
      setSelectedWeek(getWeekFromDate(new Date()))
    }
  }, [view, selectedWeek])

  useEffect(() => {
    if (!selectedWeek) return
    console.log('주간 통계 API 호출:', selectedWeek.start, selectedWeek.end)
    // TODO: 실제 API 연결
  }, [selectedWeek])

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
          onChange={handleTabChange}
        />

        <StatisticsBorder>
          {/* 월간 보기 */}
          {view === 'monthly' && (
            <View style={styles.monthlyLayout}>
              <StatisticsFilter
                year={year}
                month={month}
                onPressYear={() => console.log('연도 선택')}
                onPressMonth={() => console.log('월 선택')}
                onPressExp={() => setExpModalVisible(true)}
              />
              <MonthlyStatistics
                year={year}
                month={month}
                onSelectDate={(date) => {
                  console.log('선택한 날짜:', date)
                  setSelectedDate(date)
                  setView('daily')
                }}
              />
              <StatisticsSummary
                left={{ label: '월간 평균', value: '80%' }}
                right={{ label: '가장 집중한 주', value: '3주차' }}
              />
            </View>
          )}

          {/* 일간 상세 보기 */}
          {view === 'daily' && (
            <DailyStatistics
              date={selectedDate}
              onBack={() => setView('monthly')}
            />
          )}

          {/* 주간 보기 */}
          {view === 'weekly' && (
            <>

              <WeeklyCalendar
                visible={calendarVisible}
                onClose={() => setCalendarVisible(false)}
                onSelectDate={(date) => {
                  setSelectedWeek(getWeekFromDate(date))
                  setCalendarVisible(false)
                }}
              />

              <WeeklyStatistics
                weekRange={selectedWeek}
                onPressCalendar={() => setCalendarVisible(true)}
              />
            </>
          )}

          {view === 'subject' && <SubjectStatistics />}
        </StatisticsBorder>

        <ExpModal
          visible={isExpModalVisible}
          onClose={() => setExpModalVisible(false)}
          studentName={name || "학생"}
        />

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

  monthlyLayout: {
    flex: 1,
    justifyContent: 'space-between',
  },
})
