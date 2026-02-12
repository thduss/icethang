import React, { useEffect, useState } from 'react'
import { StyleSheet, View, SafeAreaView } from 'react-native'
import { useRouter } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'

import LeftSidebar from '../../components/Menu/LeftSidebar'
import MainArea from './MainArea'
import Header from './Header'
import StudyStartModal from '../../components/StudyStartModal'

import { AppDispatch, RootState } from '../../store/stores'
import { fetchSchedules } from '../../store/slices/scheduleSlice'
import { ScheduleDto } from '../../services/scheduleService'
import { getTodayYYYYMMDD } from '../../utils/data'

const TeacherMainPage = () => {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()

  const selectedClassId = useSelector((state: RootState) => state.class.selectedClassId)
  const scheduleData = useSelector((state: RootState) => state.schedule.items)

  const [showModal, setShowModal] = useState(false)
  const [currentLesson, setCurrentLesson] = useState<ScheduleDto | null>(null)

  useEffect(() => {
    if (!selectedClassId) return
    const targetDate = getTodayYYYYMMDD()
    dispatch(fetchSchedules({ groupId: selectedClassId, targetDate }))
  }, [selectedClassId, dispatch])

  return (
    <SafeAreaView style={styles.outer}>
      <View style={styles.screen}>
        <LeftSidebar />

        <View style={styles.rightArea}>
          <Header />
          <View style={styles.mainContent}>
            <MainArea />
          </View>
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
            router.push({
              pathname: '/screens/Teacher_Lesson',
              params: {
                classId: selectedClassId,
                subject: currentLesson.subject,
                classNo: currentLesson.classNo,
              }
            })
          }}
        />
      )}
    </SafeAreaView>
  )
}

export default TeacherMainPage

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#F3EED4',
  },
  screen: {
    flex: 1,
    flexDirection: 'row',
  },
  rightArea: {
    flex: 1,
    paddingHorizontal: '3%', 
    paddingVertical: 24,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center',    
  }
})