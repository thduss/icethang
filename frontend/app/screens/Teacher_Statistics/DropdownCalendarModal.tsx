import { Modal, View, Text, StyleSheet, Pressable } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { useState, useEffect } from 'react'

interface Props {
  visible: boolean
  initialYear: number
  initialMonth: number
  onClose: () => void
  onConfirm: (year: number, month: number) => void
}

const YEARS = Array.from({ length: 10 }, (_, i) => 2019 + i)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

const DropdownCalendarModal = ({
  visible,
  initialYear,
  initialMonth,
  onClose,
  onConfirm,
}: Props) => {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)

  useEffect(() => {
    if (visible) {
      setYear(initialYear)
      setMonth(initialMonth)
    }
  }, [visible, initialYear, initialMonth])


  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>

      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>기간 선택</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.pickerRow}>
            <Picker
              selectedValue={year}
              style={styles.picker}
              onValueChange={setYear}
            >
              {YEARS.map((y) => (
                <Picker.Item key={y} label={`${y}년`} value={y} />
              ))}
            </Picker>

            <Picker
              selectedValue={month}
              style={styles.picker}
              onValueChange={setMonth}
            >
              {MONTHS.map((m) => (
                <Picker.Item key={m} label={`${m}월`} value={m} />
              ))}
            </Picker>
          </View>

          <Pressable
            style={styles.confirmButton}
            onPress={() => onConfirm(year, month)}
          >
            <Text style={styles.confirmText}>선택 완료</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

export default DropdownCalendarModal

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  close: {
    fontSize: 20,
  },
  pickerRow: {
    flexDirection: 'row',
  },
  picker: {
    flex: 1,
  },
  confirmButton: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
})
