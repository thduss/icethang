import { StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import { useState, useEffect } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import { getStudentDetail } from '../../api/student'

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
import DropdownCalendarModal from './DropdownCalendarModal'

type StatisticsView = ViewType | 'daily'

interface StudentDetail {
  studentId: number
  name: string
  studentNumber: number
  deviceUuid: string
  currentXp: number
  currentLevel: number
}


const index = () => {
  const { studentId, classId } = useLocalSearchParams<{
    studentId: string
    classId: string
  }>()

  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [studentLoading, setStudentLoading] = useState(true)
  const [studentError, setStudentError] = useState<string | null>(null)

  const [view, setView] = useState<ViewType | 'daily'>('monthly')
  const [year, setYear] = useState(2025)
  const [month, setMonth] = useState(11)

  const [isExpModalVisible, setExpModalVisible] = useState(false)

  const [calendarVisible, setCalendarVisible] = useState(false)
  const [calendarModalVisible, setCalendarModalVisible] = useState(false)


  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedWeek, setSelectedWeek] = useState<{
    start: Date
    end: Date
  } | null>(null)

  useEffect(() => {
    const fetchStudentDetail = async () => {
      if (!studentId || !classId) return

      try {
        setStudentLoading(true)
        setStudentError(null)

        const data = await getStudentDetail(
          Number(classId),
          Number(studentId)
        )

        console.log('✅ 학생 상세 정보:', data)
        setStudent(data)
      } catch (e) {
        console.error('❌ 학생 상세 조회 실패:', e)
        setStudentError('학생 정보를 불러오지 못했습니다.')
      } finally {
        setStudentLoading(false)
      }
    }

    fetchStudentDetail()
  }, [studentId, classId])


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

  if (studentLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color="#8D7B68" />
        <Text style={styles.stateText}>학생 정보 불러오는 중...</Text>
      </View>
    )
  }

  /**
   * ❌ 학생 정보 에러
   */
  if (studentError || !student) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.stateText}>
          {studentError ?? '학생 정보를 불러올 수 없습니다.'}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <LeftSidebar />

      <View style={styles.content}>
        <StatisticsHeader
          name={student.name}
          number={Number(student.studentNumber)}
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
                onPressYear={() => setCalendarModalVisible(true)}
                onPressMonth={() => setCalendarModalVisible(true)}
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

        <DropdownCalendarModal
          visible={calendarModalVisible}
          initialYear={year}
          initialMonth={month}
          onClose={() => setCalendarModalVisible(false)}
          onConfirm={(y, m) => {
            setYear(y)
            setMonth(m)
            setCalendarModalVisible(false)
          }}
        />


        <ExpModal
          visible={isExpModalVisible}
          onClose={() => setExpModalVisible(false)}
          studentName={student.name}
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
