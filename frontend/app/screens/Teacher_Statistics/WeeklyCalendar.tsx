import { StyleSheet, Text, View, Pressable, Modal } from 'react-native'
import { useState } from 'react'

interface WeeklyCalendarProps {
  visible: boolean
  onClose: () => void
  onSelectDate: (date: Date) => void
}

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토']

const CELL_SIZE = 40
const COLUMN_COUNT = 7
const GRID_WIDTH = CELL_SIZE * COLUMN_COUNT

const WeeklyCalendar = ({
  visible,
  onClose,
  onSelectDate,
}: WeeklyCalendarProps) => {


  const [currentDate, setCurrentDate] = useState(new Date())

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const createCalendarDates = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const startPadding = firstDay.getDay()
    const totalDays = lastDay.getDate()

    const dates: (Date | null)[] = []

    for (let i = 0; i < startPadding; i++) {
      dates.push(null)
    }

    for (let d = 1; d <= totalDays; d++) {
      dates.push(new Date(year, month, d))
    }

    return dates
  }

  const dates = createCalendarDates()

  /** 월 이동 */
  const changeMonth = (offset: number) => {
    const next = new Date(currentDate)
    next.setMonth(currentDate.getMonth() + offset)
    setCurrentDate(next)
    setSelectedDate(null)
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>

          {/* 헤더 (월 이동) */}
          <View style={styles.header}>
            <Pressable onPress={() => changeMonth(-1)}>
              <Text style={styles.arrow}>{'<'}</Text>
            </Pressable>

            <Text style={styles.monthText}>
              {currentDate.getMonth() + 1}월 {currentDate.getFullYear()}
            </Text>

            <Pressable onPress={() => changeMonth(1)}>
              <Text style={styles.arrow}>{'>'}</Text>
            </Pressable>
          </View>

          {/* 요일 */}
          <View style={styles.weekRow}>
            {WEEK_DAYS.map((day) => (
              <Text key={day} style={styles.weekText}>
                {day}
              </Text>
            ))}
          </View>

          {/* 날짜 */}
          <View style={styles.grid}>
            {dates.map((date, index) =>
              date ? (
                <Pressable
                  key={index}
                  onPress={() => setSelectedDate(date)}
                  style={[
                    styles.dayBox,
                    selectedDate?.toDateString() === date.toDateString() &&
                    styles.selectedDay,
                  ]}
                >
                  <Text>{date.getDate()}</Text>
                </Pressable>
              ) : (
                <View key={index} style={styles.emptyBox} />
              )
            )}
          </View>

          {/* 버튼 영역 */}
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text>취소</Text>
            </Pressable>

            <Pressable
              disabled={!selectedDate}
              onPress={() => {
                if (selectedDate) {
                  onSelectDate(selectedDate)
                }
              }}
              style={[
                styles.applyBtn,
                !selectedDate && styles.disabledBtn,
              ]}
            >
              <Text style={styles.applyText}>적용</Text>
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  )
}

export default WeeklyCalendar

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modal: {
    width: 320,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },

  header: {
    width: GRID_WIDTH,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  arrow: {
    fontSize: 18,
    fontWeight: '700',
  },

  monthText: {
    fontWeight: '700',
  },

  weekRow: {
    width: GRID_WIDTH,
    flexDirection: 'row',
  },

  weekText: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 12,
    color: '#666',
  },

  grid: {
    width: GRID_WIDTH,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },

  dayBox: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },

  selectedDay: {
    backgroundColor: '#4C6EF5',
  },

  emptyBox: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },

  footer: {
    width: GRID_WIDTH,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },

  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  applyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4C6EF5',
    borderRadius: 8,
  },

  applyText: {
    color: '#FFF',
    fontWeight: '600',
  },

  disabledBtn: {
    opacity: 0.4,
  },
})
