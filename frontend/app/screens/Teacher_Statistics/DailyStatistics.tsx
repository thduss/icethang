import React, { useState, useRef, useEffect } from 'react'
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, PanResponder, LayoutChangeEvent } from 'react-native'
import { Calendar } from 'lucide-react-native'

interface DailyStatisticsProps {
  date: string
  onBack: () => void
}

interface SubjectData {
  id: number
  time: string
  subject: string
  score: number
}

// [테스트 더미 데이터]
const initialDailyData: SubjectData[] = [
  { id: 1, time: '09:00 - 10:00', subject: '수학', score: 90 },
  { id: 2, time: '10:00 - 11:00', subject: '영어', score: 60 },
  { id: 3, time: '11:00 - 12:00', subject: '과학', score: 28 },
  { id: 4, time: '13:00 - 14:00', subject: '국어', score: 85 },
  { id: 5, time: '14:00 - 15:00', subject: '사회', score: 45 },
]

const iconGood = require('../../../assets/TeacherManage_good.png')
const iconNormal = require('../../../assets/TeacherManage_normal.png')
const iconBad = require('../../../assets/TeacherManage_bad.png')

const getStatusInfo = (score: number) => {
  if (score >= 80) return { color: '#7FA864', icon: iconGood }
  if (score >= 40) return { color: '#E6C85C', icon: iconNormal }
  return { color: '#D32F2F', icon: iconBad }
}

/**
 * ----------------------------------------------------------------------
 * 개별 카드 컴포넌트
 * ----------------------------------------------------------------------
 */
const SubjectCard = ({ 
  item, 
  isLast, 
  onSave 
}: { 
  item: SubjectData, 
  isLast: boolean, 
  onSave: (id: number, newScore: number) => void 
}) => {
  
  const [isEditing, setIsEditing] = useState(false)
  const [localScore, setLocalScore] = useState(item.score)
  
  const stateRef = useRef({ isEditing: false, localScore: item.score, barWidth: 0 });

  useEffect(() => {
    stateRef.current.isEditing = isEditing;
    stateRef.current.localScore = localScore;
  }, [isEditing, localScore]);

  useEffect(() => { setLocalScore(item.score) }, [item.score])

  const { color, icon } = getStatusInfo(localScore)
  const startScoreRef = useRef(localScore)

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => stateRef.current.isEditing,
      onMoveShouldSetPanResponder: () => stateRef.current.isEditing,
      onPanResponderGrant: () => { startScoreRef.current = stateRef.current.localScore; },
      onPanResponderMove: (evt, gestureState) => {
        const { barWidth } = stateRef.current;
        if (barWidth === 0) return
        
        const deltaPercent = (gestureState.dx / barWidth) * 100
        let newScore = startScoreRef.current + deltaPercent
        newScore = Math.max(0, Math.min(100, Math.round(newScore)))
        setLocalScore(newScore)
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current

  const handleSave = () => { onSave(item.id, localScore); setIsEditing(false) }
  const handleCancel = () => { setLocalScore(item.score); setIsEditing(false) }

  return (
    <View style={styles.row}>
      {/* 왼쪽 타임라인 */}
      <View style={styles.timelineLeft}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        {!isLast && <View style={styles.line} />}
      </View>

      {/* 오른쪽 카드 */}
      <View style={[styles.card, isEditing && styles.cardEditing]}>
        
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            <Text style={styles.timeText}>{item.time}</Text> | {item.subject}
          </Text>
          <View style={styles.buttonGroup}>
            {isEditing ? (
              <>
                <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={handleSave}>
                  <Text style={styles.btnTextWhite}>저장</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={handleCancel}>
                  <Text style={styles.btnTextDark}>취소</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Text style={styles.editText}>수정하기</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.progressRow}>
          
          {/* 왼쪽에 점수 */}
          <Text style={[styles.fixedScoreText, { color: isEditing ? '#7FA864' : '#5D4037' }]}>
            {localScore}%
          </Text>

          {/* 프로그레스 바 영역 */}
          <View 
            style={styles.progressBarWrapper} 
            onLayout={(e) => { stateRef.current.barWidth = e.nativeEvent.layout.width }}
          >
            <View style={styles.track} />
            <View style={[styles.fill, { width: `${localScore}%`, backgroundColor: color }]} />
            <View 
              style={[styles.handleContainer, { left: `${localScore}%` }]} 
              {...panResponder.panHandlers}
            >
              <Image 
                source={icon} 
                style={[
                  styles.characterIcon, 
                  isEditing && { transform: [{ scale: 1.1 }] }
                ]} 
              />
              {isEditing && <View style={styles.dragKnob} />}
            </View>
          </View>
        </View>

        {isEditing && <Text style={styles.guideText}>좌우로 움직여 수정해보세요!</Text>}
      </View>
    </View>
  )
}

const DailyStatistics = ({ date, onBack }: DailyStatisticsProps) => {
  const [data, setData] = useState<SubjectData[]>(initialDailyData)

  if (!date) return <View style={styles.container}><Text>날짜 정보 없음</Text></View>

  const formattedDate = date.split('-').map(Number)
  const dateString = `${formattedDate[0]}년 ${formattedDate[1]}월 ${formattedDate[2]}일`
  const averageScore = Math.round(data.reduce((acc, cur) => acc + cur.score, 0) / data.length)

  const handleUpdateScore = (id: number, newScore: number) => {
    setData(prevData => prevData.map(item => item.id === id ? { ...item, score: newScore } : item))
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>{dateString}</Text>
          <Calendar size={20} color="#5D4037" style={{ marginLeft: 8 }} />
        </View>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 50 }}>
        <View style={styles.timelineContainer}>
          {data.map((item, index) => (
            <SubjectCard key={item.id} item={item} isLast={index === data.length - 1} onSave={handleUpdateScore} />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          오늘의 평균: <Text style={styles.highlightText}>{averageScore}%</Text> ({averageScore > 80 ? '훌륭해요!' : averageScore > 50 ? '잘했어요!' : '조금 더 노력해봐요!'})
        </Text>
      </View>
    </View>
  )
}

export default DailyStatistics

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 10 },
  headerContainer: { alignItems: 'center', marginBottom: 20, position: 'relative', justifyContent: 'center', height: 40 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12 },
  dateText: { fontSize: 20, fontWeight: 'bold', color: '#3E2723' },
  
  scrollArea: { flex: 1, paddingHorizontal: 4 },
  timelineContainer: { paddingBottom: 20 },
  row: { flexDirection: 'row', marginBottom: 25 },
  timelineLeft: { width: 30, alignItems: 'center', paddingTop: 45, marginRight: 8 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#fff', zIndex: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1 },
  line: { width: 2, flex: 1, backgroundColor: '#C5B6A8', borderStyle: 'dotted', borderWidth: 1, borderColor: '#C5B6A8', marginTop: 4, marginBottom: -45 },
  
  card: { flex: 1, backgroundColor: '#FDFBF8', borderRadius: 16, borderWidth: 1, borderColor: '#3A2E1F', padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 3, zIndex: 1 },
  cardEditing: { borderColor: '#7FA864', borderWidth: 2, backgroundColor: '#FAFAF5' }, 
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#3E2723' },
  timeText: { color: '#8D7B68', fontWeight: '600', fontSize: 14 },
  
  buttonGroup: { flexDirection: 'row', gap: 6 },
  editButton: { backgroundColor: '#EAE0D5', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
  editText: { fontSize: 12, color: '#5D4037', fontWeight: 'bold' },
  btn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
  btnSave: { backgroundColor: '#7FA864' },
  btnCancel: { backgroundColor: '#D7C8B6' },
  btnTextWhite: { fontSize: 12, color: '#fff', fontWeight: 'bold' },
  btnTextDark: { fontSize: 12, color: '#5D4037', fontWeight: 'bold' },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 5,
    paddingRight: 15,
  },

  fixedScoreText: {
    width: 45,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginRight: 12,
  },

  progressBarWrapper: { 
    flex: 1, 
    height: 24, 
    justifyContent: 'center', 
    position: 'relative',
  },

  track: { position: 'absolute', left: 0, right: 0, height: 24, backgroundColor: '#E6E0D3', borderRadius: 12, borderWidth: 1, borderColor: '#8D7B68' },
  fill: { height: 24, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },

  handleContainer: { 
    position: 'absolute', 
    top: -38,
    marginLeft: -25,
    width: 50, 
    alignItems: 'center', 
    zIndex: 100, 
    elevation: 10 
  },

  characterIcon: { 
    width: 50, 
    height: 50,
    resizeMode: 'contain'
  },
  
  dragKnob: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7FA864', marginTop: -2 },

  guideText: { textAlign: 'center', fontSize: 12, color: '#7FA864', fontWeight: 'bold', marginTop: 15 },
  
  footer: { backgroundColor: '#EBE2D3', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#8D7B68', marginTop: 10, marginBottom: 10 },
  footerText: { fontSize: 16, fontWeight: 'bold', color: '#3E2723' },
  highlightText: { fontSize: 18, color: '#000' }
})