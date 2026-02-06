import { StyleSheet, Text, View, Pressable, Modal } from 'react-native'
import { useState, useEffect, useMemo } from 'react'
import { Picker } from '@react-native-picker/picker'

interface WeeklyCalendarProps {
  visible: boolean
  onClose: () => void
  onSelectDate: (date: Date) => void
}

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토']
const YEARS = Array.from({ length: 10 }, (_, i) => 2020 + i)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

const CELL_SIZE = 42
const GRID_WIDTH = CELL_SIZE * 7

const isSameDay = (a: Date, b: Date) =>
  a.toDateString() === b.toDateString()

/** 선택 날짜 기준 월~금 계산 */
const getWeekdaysFromDate = (date: Date) => {
  const day = date.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day

  const monday = new Date(date)
  monday.setDate(date.getDate() + mondayOffset)

  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const WeeklyCalendar = ({ visible, onClose, onSelectDate }: WeeklyCalendarProps) => {
  const today = new Date()

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const createCalendarDates = () => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)

    const startPadding = firstDay.getDay()
    const totalDays = lastDay.getDate()

    const dates: (Date | null)[] = []
    for (let i = 0; i < startPadding; i++) dates.push(null)
    for (let d = 1; d <= totalDays; d++) {
      dates.push(new Date(year, month - 1, d))
    }
    return dates
  }

  const dates = createCalendarDates()

  const selectedWeekdays = useMemo(
    () => (selectedDate ? getWeekdaysFromDate(selectedDate) : []),
    [selectedDate]
  )

  const moveMonth = (offset: number) => {
    const next = new Date(year, month - 1 + offset, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth() + 1)
    setSelectedDate(null)
  }

  useEffect(() => {
    if (visible) {
      setYear(today.getFullYear())
      setMonth(today.getMonth() + 1)
      setSelectedDate(null)
    }
  }, [visible])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>

          {/* 헤더 */}
          <View style={styles.header}>
            <Pressable onPress={() => moveMonth(-1)}>
              <Text style={styles.arrow}>{'<'}</Text>
            </Pressable>

            <View style={styles.pickerRow}>
              <Picker
                selectedValue={year}
                style={styles.picker}
                onValueChange={(v) => setYear(Number(v))}
              >
                {YEARS.map((y) => (
                  <Picker.Item key={y} label={`${y}년`} value={y} />
                ))}
              </Picker>

              <Picker
                selectedValue={month}
                style={styles.picker}
                onValueChange={(v) => setMonth(Number(v))}
              >
                {MONTHS.map((m) => (
                  <Picker.Item key={m} label={`${m}월`} value={m} />
                ))}
              </Picker>
            </View>

            <Pressable onPress={() => moveMonth(1)}>
              <Text style={styles.arrow}>{'>'}</Text>
            </Pressable>
          </View>

          {/* 요일 */}
          <View style={styles.weekRow}>
            {WEEK_DAYS.map((day) => (
              <Text key={day} style={styles.weekText}>{day}</Text>
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
                    selectedWeekdays.some(d => isSameDay(d, date)) && styles.weekHighlight,
                    selectedDate && isSameDay(selectedDate, date) && styles.selectedDay,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      selectedDate && isSameDay(selectedDate, date) && styles.selectedDayText,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </Pressable>
              ) : (
                <View key={index} style={styles.emptyBox} />
              )
            )}
          </View>

          {/* 하단 버튼 */}
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text>취소</Text>
            </Pressable>

            <Pressable
              disabled={!selectedDate}
              onPress={() => selectedDate && onSelectDate(selectedDate)}
              style={[styles.applyBtn, !selectedDate && styles.disabledBtn]}
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
    width: 350,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },

  header: {
    width: GRID_WIDTH,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  picker: {
    width: 140,
    height: 70,
    justifyContent: 'center',
  },

  arrow: { fontSize: 18, fontWeight: '700' },
  weekRow: { width: GRID_WIDTH, flexDirection: 'row' },
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

  weekHighlight: {
    backgroundColor: '#E8EDFF',
  },

  selectedDay: {
    backgroundColor: '#4C6EF5',
  },

  dayText: {
    fontSize: 10,
    color: '#3A2E1F',
  },

  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
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

  cancelBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  applyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4C6EF5',
    borderRadius: 8,
  },
  applyText: { color: '#FFF', fontWeight: '600' },
  disabledBtn: { opacity: 0.4 },
})
