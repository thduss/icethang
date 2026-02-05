import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'
import AsyncStorage from '@react-native-async-storage/async-storage'

import LeftSidebar from '../../components/Menu/LeftSidebar'
import MainArea from './MainArea'
import Header from './Header'
import StudyStartModal from '../../components/StudyStartModal'

import { AppDispatch, RootState } from '../../store/stores'
import { fetchSchedules } from '../../store/slices/scheduleSlice'
import { PERIOD_START_TIME } from '../../utils/periodTime'
import { ScheduleDto } from '../../services/scheduleService'
import { getTodayYYYYMMDD } from '../../utils/data'


const TeacherMainPage = () => {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()

  const selectedClassId = useSelector(
    (state: RootState) => state.class.selectedClassId
  )

  const scheduleData = useSelector(
    (state: RootState) => state.schedule.items
  )


  const [showModal, setShowModal] = useState(false)
  const [currentLesson, setCurrentLesson] =
    useState<ScheduleDto | null>(null)


  useEffect(() => {
    if (!selectedClassId) return

    const targetDate = getTodayYYYYMMDD()
    
    dispatch(
      fetchSchedules({
        groupId: selectedClassId,
        targetDate,
      })
    )
  }, [selectedClassId, dispatch])


  useEffect(() => {
    if (!scheduleData || scheduleData.length === 0) return

    const checkLessonStart = async () => {
      const now = new Date()
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
      const today = days[now.getDay()]

      const todayLessons = scheduleData.filter(
        item => item.dayOfWeek === today
      )

      for (const item of todayLessons) {
        const startTime = PERIOD_START_TIME[item.classNo]
        if (!startTime) continue

        const [h, m] = startTime.split(':').map(Number)
        const lessonTime = new Date()
        lessonTime.setHours(h, m, 0, 0)

        const diff = Math.abs(now.getTime() - lessonTime.getTime())

        if (true) {
          const todayKey = `lesson-start-${new Date().toDateString()}-${item.classNo}`

          const alreadyShown = await AsyncStorage.getItem(todayKey)
          if (alreadyShown) continue

          await AsyncStorage.setItem(todayKey, 'true')

          setCurrentLesson(item)
          setShowModal(true)
          break
        }
      }
    }

    checkLessonStart()
    const timer = setInterval(checkLessonStart, 30_000)
    return () => clearInterval(timer)
  }, [scheduleData])


  return (
    <View style={styles.outer}>
      <View style={styles.screen}>
        <LeftSidebar />

        <View style={styles.rightArea}>
          <Header />
          <MainArea />
        </View>
      </View>

      {currentLesson && (
        <StudyStartModal
          visible={showModal}
          subject={currentLesson.subject}
          period={currentLesson.classNo}
          onCancel={() => setShowModal(false)}
          onConfirm={() => {
            setShowModal(false)             
            router.push('/screens/Teacher_Lesson') 
          }}
        />

      )}
    </View>
  )
}

export default TeacherMainPage

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#F3EED4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screen: {
    width: 1280,
    height: 800,
    flexDirection: 'row',
    backgroundColor: '#F3EED4',
  },
  rightArea: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 24,
    backgroundColor: '#F3EED4',
  },
})
