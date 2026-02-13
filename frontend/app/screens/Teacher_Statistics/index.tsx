import { StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import { useState, useEffect } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'

import { AppDispatch, RootState } from 'app/store/stores'
import {
  fetchDailyStatistics,
  fetchWeeklyStatistics,
  fetchMonthlyStatistics,
  fetchSubjectStatistics
} from 'app/store/slices/statisticsSlice'
import { getStudentDetail, getStudentXp, StudentXpResponse } from '../../services/studentService'

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

interface StudentBasic {
  studentId: number
  name: string
  studentNumber: number
  deviceUuid: string
}


const index = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { studentId, classId, hideSidebar } = useLocalSearchParams<{
    studentId: string
    classId: string
    hideSidebar?: string
  }>()

  const parsedStudentId = Number(studentId)
  const parsedClassId = Number(classId)
  const shouldHideSidebar = hideSidebar === 'true'

  console.log('📍 현재 파라미터 상태:', { studentId, classId });

  const [student, setStudent] = useState<StudentBasic | null>(null)
  const [studentLoading, setStudentLoading] = useState(true)
  const [studentError, setStudentError] = useState<string | null>(null)

  const [xpInfo, setXpInfo] = useState<StudentXpResponse | null>(null)

  const { daily, weekly, monthly, subjects } =
    useSelector((state: RootState) => state.statistics)


  const [view, setView] = useState<StatisticsView>('monthly')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedWeek, setSelectedWeek] = useState<{ start: Date; end: Date } | null>(null)

  const [calendarVisible, setCalendarVisible] = useState(false)
  const [calendarModalVisible, setCalendarModalVisible] = useState(false)
  const [isExpModalVisible, setExpModalVisible] = useState(false)


  /** 학생 상세 조회 */
  useEffect(() => {
    if (!studentId || !classId) return
    const fetchStudent = async () => {

      console.log('📡 [학생 상세 조회 요청]', {
        classId,
        studentId,
      })

      try {
        setStudentLoading(true)
        const data = await getStudentDetail(Number(classId), Number(studentId))
        console.log('✅ [학생 상세 조회 성공]', data)

        setStudent(data)
      } catch (e) {
        console.error('❌ [학생 상세 조회 실패]', e)
        setStudentError('학생 정보를 불러오지 못했습니다.')
      } finally {
        setStudentLoading(false)
      }
    }
    fetchStudent()
  }, [studentId, classId])


  /** XP / 레벨 조회 */
  useEffect(() => {
    if (!studentId || !classId) return
    const fetchXp = async () => {
      try {
        const data = await getStudentXp(Number(classId), Number(studentId))
        console.log('🎯 학생 XP 조회 응답:', data)
        setXpInfo(data)
      } catch (e) {
        console.error('❌ XP 조회 실패', e)
      }
    }

    fetchXp()
  }, [studentId, classId])


  /** 통계 API */
  const formatYYYYMM = (y: number, m: number) =>
    `${y}-${String(m).padStart(2, '0')}`

  const formatYYYYMMDD = (date: Date) =>
    `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
      date.getDate()
    ).padStart(2, '0')}`

  const getWeekFromDate = (date: Date) => {
    const day = date.getDay()
    const mondayOffset = day === 0 ? -6 : 1 - day
    const start = new Date(date)
    start.setDate(date.getDate() + mondayOffset)
    const end = new Date(start)
    end.setDate(start.getDate() + 4)
    return { start, end }
  }


  /** 월간 */
  useEffect(() => {
    if (studentId && classId) {
      dispatch(
        fetchMonthlyStatistics({
          groupId: Number(classId),
          studentId: Number(studentId),
          month: formatYYYYMM(year, month),
        })
      )
    }
  }, [year, month, studentId, classId])

  /** 주간 */
  useEffect(() => {
    if (view === 'weekly' && !selectedWeek) {
      setSelectedWeek(getWeekFromDate(new Date()))
    }
    if (view === 'weekly' && selectedWeek) {
      dispatch(
        fetchWeeklyStatistics({
          groupId: Number(classId),
          studentId: Number(studentId),
          startDate: formatYYYYMMDD(selectedWeek.start),
        })
      )
    }
  }, [view, selectedWeek])

  /** 일간 */
  useEffect(() => {
    if (view === 'daily' && selectedDate) {
      dispatch(
        fetchDailyStatistics({
          groupId: Number(classId),
          studentId: Number(studentId),
          date: selectedDate,
        })
      )
    }
  }, [view, selectedDate])

  /** 과목별 */
  useEffect(() => {
    if (view === 'subject') {
      dispatch(
        fetchSubjectStatistics({
          groupId: Number(classId),
          studentId: Number(studentId),
          month: formatYYYYMM(year, month),
        })
      )
    }
  }, [view, year, month])

  if (studentLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (studentError || !student) {
    return (
      <View style={styles.center}>
        <Text>{studentError}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {!shouldHideSidebar && <LeftSidebar />}

      <View style={styles.content}>
        <StatisticsHeader
          name={student.name}
          number={student.studentNumber}
          onBack={() => (view === 'daily' ? setView('monthly') : router.back())}
        />

        <StatisticsTabs
          value={view === 'daily' ? 'monthly' : view}
          onChange={setView}
        />

        <StatisticsBorder>
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
                data={monthly}
                onSelectDate={(date) => {
                  setSelectedDate(date.replace(/-/g, ''))
                  setView('daily')
                }}
              />
              <StatisticsSummary
                left={{ label: '월간 평균', value: `${calculateAvg(monthly)}%` }}
                right={{ label: '데이터 수', value: `${monthly.length}일` }}
              />
            </View>
          )}

          {view === 'daily' && (
            <DailyStatistics
              date={selectedDate}
              data={daily}
              onBack={() => setView('monthly')}
            />
          )}

          {view === 'weekly' && (
            <WeeklyStatistics
              weekRange={selectedWeek}
              data={weekly}
              onPressCalendar={() => setCalendarVisible(true)}
            />
          )}

          {view === 'subject' && <SubjectStatistics data={subjects} />}
        </StatisticsBorder>

        <ExpModal
          visible={isExpModalVisible}
          onClose={() => setExpModalVisible(false)}
          studentName={student.name}
          studentId={parsedStudentId}
          classId={parsedClassId}
        />

        <WeeklyCalendar
          visible={calendarVisible}
          onClose={() => setCalendarVisible(false)}
          onSelectDate={(date) => {
            setSelectedWeek(getWeekFromDate(date))
            setCalendarVisible(false)
          }}
        />

        <DropdownCalendarModal
          visible={calendarModalVisible}
          initialYear={year}
          initialMonth={month}
          onClose={() => setCalendarModalVisible(false)}
          onConfirm={(y, m) => {
            console.log('📅 선택된 연/월:', y, m)
            setYear(y)
            setMonth(m)
            setCalendarModalVisible(false)
          }}
        />
      </View>
    </View>
  )
}

const calculateAvg = (data: any[]) =>
  data.length === 0
    ? 0
    : (
      data.reduce((sum, d) => sum + (d.averageFocusRate || 0), 0) /
      data.length
    ).toFixed(1)

export default index

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F3EED4' },
  content: { flex: 1, padding: 16 },
  monthlyLayout: { flex: 1, justifyContent: 'space-between', minHeight: 0 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
})
