import { StyleSheet, Text, View } from 'react-native'
import { useState, useEffect } from 'react'
import { useLocalSearchParams, router } from 'expo-router'

// Components
import LeftSidebar from '../../components/menu/LeftSidebar'
import StatisticsHeader from '../../components/menu/StatisticsHeader'
import StatisticsTabs, { ViewType } from 'app/components/menu/StatisticsTabs'
import StatisticsFilter from 'app/components/menu/StatisticsFilter'
import StatisticsSummary from 'app/components/menu/StatisticsSummary'
import StatisticsBorder from 'app/components/menu/StatisticsBorder'

// Statistics Components
import DailyStatistics from './DailyStatistics'
import MonthlyStatistics from './MonthlyStatistics'
import WeeklyStatistics from './WeeklyStatistics'
import WeeklyCalendar from './WeeklyCalendar'
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
          {/* 1. 월간 보기 (Monthly) */}
          {view === 'monthly' && (
            <>
              <StatisticsFilter
                year={year}
                month={month}
                onPressYear={() => console.log('연도 선택')}
                onPressMonth={() => console.log('월 선택')}
                onPressExp={() => console.log('경험치 관리')}
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
            </>
          )}

          {/* 2. 일간 상세 보기 (Daily) */}
          {view === 'daily' && (
            <DailyStatistics
              date={selectedDate}
              onBack={() => setView('monthly')}
            />
          )}

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
