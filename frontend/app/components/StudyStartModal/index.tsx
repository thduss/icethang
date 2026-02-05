import React from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native'

interface StudyStartModalProps {
  visible: boolean
  subject: string
  period: number
  onConfirm: () => void
  onCancel: () => void
}

const StudyStartModal = ({
  visible,
  subject,
  period,
  onConfirm,
  onCancel,
}: StudyStartModalProps) => {
  if (!visible) return null

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>수업 시작 안내</Text>

          <Text style={styles.desc}>
            {period}교시 {subject} 수업을{'\n'}
            시작하시겠습니까?
          </Text>

          <View style={styles.buttons}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                styles.cancel,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                styles.confirm,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.confirmText}>시작</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default StudyStartModal

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modal: {
    width: 360,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },

  desc: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
  },

  /** 🔽 버튼 영역 */
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  button: {
    width: 140,            
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cancel: {
    backgroundColor: '#E0E0E0',
  },

  confirm: {
    backgroundColor: '#4CAF50',
  },

  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  pressed: {
    opacity: 0.85,
  },
})
