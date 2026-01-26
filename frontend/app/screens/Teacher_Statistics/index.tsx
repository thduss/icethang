import { StyleSheet, Text, View } from 'react-native'
import { useState, useEffect } from 'react'
import { useLocalSearchParams } from 'expo-router'

import LeftSidebar from '../../components/menu/LeftSidebar'
import StatisticsHeader from '../../components/menu/StatisticsHeader'
import StatisticsTabs, { ViewType } from 'app/components/menu/StatisticsTabs'
import StatisticsFilter from 'app/components/menu/StatisticsFilter'
import StatisticsSummary from 'app/components/menu/StatisticsSummary'
import StatisticsBorder from 'app/components/menu/StatisticsBorder'

import MonthlyStatistics from './MonthlyStatistics'
import WeeklyStatistics from './WeeklyStatistics'
import WeeklyCalendar from './WeeklyCalendar'


const index = () => {

  const { name, number } = useLocalSearchParams<{
    name: string
    number: string
  }>()

  const [view, setView] = useState<ViewType>('monthly')
  const [year, setYear] = useState(2025)
  const [month, setMonth] = useState(11)

  const [calendarVisible, setCalendarVisible] = useState(false)

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const [selectedWeek, setSelectedWeek] = useState<{
    start: Date
    end: Date
  } | null>(null)

  useEffect(() => {
  if (view === 'weekly' && !selectedWeek) {
    const today = new Date()
    setSelectedWeek(getWeekFromDate(today))
  }
}, [view])


  const getWeekFromDate = (date: Date) => {
    const day = date.getDay() // 0(일) ~ 6(토)

    const mondayOffset = day === 0 ? -6 : 1 - day

    const start = new Date(date)
    start.setDate(date.getDate() + mondayOffset)

    const end = new Date(start)
    end.setDate(start.getDate() + 4) 

    return { start, end }
  }


  const handleChangeView = (nextView: ViewType) => {
    setView(nextView)
  }

  useEffect(() => {
    if (!selectedWeek) return

    console.log(
      '주간 통계 API 호출:',
      selectedWeek.start,
      selectedWeek.end
    )

    // TODO: 실제 API 연결
  }, [selectedWeek])


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
          onChange={handleChangeView}
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


            <MonthlyStatistics
              year={year}
              month={month}
              onSelectDate={(date) => {
                console.log('선택한 날짜:', date)
                // 여기서 나중에 daily 화면으로 전환함
              }}
            />


            <StatisticsSummary
              left={{ label: '월간 평균', value: '80%' }}
              right={{ label: '가장 집중한 주', value: '3주차' }}
            />
          </StatisticsBorder>
        )}

        {view === 'weekly' && (
          <StatisticsBorder>
            <WeeklyStatistics
              weekRange={selectedWeek}
              onPressCalendar={() => setCalendarVisible(true)}
            />

            <WeeklyCalendar
              visible={calendarVisible}
              onClose={() => setCalendarVisible(false)}
              onSelectDate={(date) => {
                setSelectedDate(date)
                setSelectedWeek(getWeekFromDate(date))
                setCalendarVisible(false)
              }}
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