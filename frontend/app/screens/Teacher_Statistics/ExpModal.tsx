import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Modal, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { Star, AlignJustify } from 'lucide-react-native';

interface ExpModalProps {
  visible: boolean
  onClose: () => void
  studentName: string
  level?: number
  xp?: number
  reason?: string
}

const historyData = [
  { id: 1, date: '오늘, 오전 10:30', subject: '체육', desc: '수업 집중 보너스 | +50 경험치 (자동)' },
  { id: 2, date: '어제, 오후 3:00', subject: '국어', desc: '과제 완료 | +100 경험치 (자동)' },
  { id: 3, date: '10월 23일, 오후 4:00', subject: '국어', desc: '특별 보상 (교사) | +30 경험치 (수동 - 청소 도움)' },
  { id: 4, date: '10월 22일, 오후 2:00', subject: '수학', desc: '퀴즈 만점 | +50 경험치 (자동)' },
]

const ExpModal = ({ visible, onClose, studentName, level = 0, xp = 0, reason }: ExpModalProps) => {
  const [amount, setAmount] = useState('')
  const [inputReason, setInputReason] = useState('')

  useEffect(() => {
    if (visible) {
      setAmount('')
      setInputReason('')
    }
  }, [visible])

  // 테스트용
  const maxExp = 3000
  const progressPercent = Math.min((xp / maxExp) * 100, 100)

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>경험치 관리</Text>
            <Star size={16} color="#FFF" fill="#FFF" />
          </View>

          <View style={styles.contentBody}>
            <View style={styles.leftPanel}>
              <View style={styles.studentBadge}>
                <Text style={styles.studentText}>
                  학생 : {studentName} | Lv.{level}
                </Text>
              </View>

              <View style={styles.formBox}>
                <Text style={styles.formLabel}>관리자 작업: 경험치 부여</Text>

                {/* 최근 사유 (조회 API) */}
                {reason && reason !== '기록된 사유가 없습니다.' && (
                  <Text style={styles.lastReason}>
                    최근 사유: {reason}
                  </Text>
                )}

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>경험치 :</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="경험치를 입력하세요"
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>이유 :</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="사유를 입력하세요"
                      value={inputReason}
                      onChangeText={setInputReason}
                    />
                  </View>
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.grantButton}>
                    <Text style={styles.grantButtonText}>경험치 부여</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.rightPanel}>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarTracker}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                  <Text style={styles.progressText}>{xp} / {maxExp} 경험치</Text>
                </View>
                <Star size={20} color="#7FA864" fill="#7FA864" style={{ marginLeft: 5 }} />
              </View>

              <View style={styles.historyContainer}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>경험치 기록</Text>
                  <AlignJustify size={16} color="#8D7B68" />
                </View>

                <ScrollView style={styles.historyList} nestedScrollEnabled={true}>
                  {historyData.map((item, index) => (
                    <View key={item.id} style={styles.historyItem}>
                      <Text style={styles.historyDate}>
                        {item.date} | {item.subject}
                      </Text>
                      <Text style={styles.historyDesc}>{item.desc}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>


          <View style={styles.footer}>
            <TouchableOpacity style={[styles.footerButton, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.footerButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.footerButton, styles.confirmButton]} onPress={onClose}>
              <Text style={styles.footerButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View >
    </Modal >
  )
}

export default ExpModal

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 700,
    backgroundColor: '#F7F3E6',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D7C8B6',
    overflow: 'hidden',
    elevation: 10,
  },

  // 헤더
  header: {
    backgroundColor: '#8D7B68',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },

  contentBody: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
    height: 320,
  },

  leftPanel: {
    flex: 1,
    gap: 10,
  },
  studentBadge: {
    backgroundColor: '#EAE0D5',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 5,
  },
  studentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  formBox: {
    flex: 1,
    backgroundColor: '#FDFBF8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 15,
    justifyContent: 'center',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5D4037',
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    width: 60,
    fontSize: 14,
    fontWeight: '600',
    color: '#3E2723',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    height: 35,
    paddingHorizontal: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#000',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  grantButton: {
    backgroundColor: '#7FA864',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    elevation: 2,
  },
  grantButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },

  lastReason: {
    fontSize: 12,
    color: '#6D6D6D',
    marginBottom: 8,
  },

  rightPanel: {
    flex: 1.2,
    gap: 10,
  },

  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarTracker: {
    flex: 1,
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7FA864',
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },

  historyContainer: {
    flex: 1,
    backgroundColor: '#FDFBF8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5D4037',
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  historyDate: {
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
  },
  historyDesc: {
    fontSize: 13,
    color: '#3E2723',
    fontWeight: '500',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 15,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#D7C8B6',
  },
  footerButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },

  cancelButton: {
    backgroundColor: '#9fa1a6',
  },

  confirmButton: {
    backgroundColor: '#7FA864',
  },

  footerButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
})