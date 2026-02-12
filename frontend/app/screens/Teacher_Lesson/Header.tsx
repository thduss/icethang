import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/stores';
import { startLesson, endLesson } from '../../store/slices/lessonSlice';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface HeaderProps {
  classId: number;
  className: string;
  participantCount: number;
  currentMode: 'NORMAL' | 'DIGITAL';
  onToggleMode: () => void;
  onEndClass: () => void;
  onStartClass: () => void;
}

export const Header = ({
  classId,
  className,
  participantCount,
  currentMode,
  onToggleMode,
  onEndClass,
  onStartClass
}: HeaderProps) => {
  const dispatch = useDispatch();
  const { isLessonStarted } = useSelector((state: RootState) => state.lesson);
  
  const isTabletMode = currentMode === 'DIGITAL';

  // 모드 변경 버튼 클릭 시
  const handleToggleSwitch = () => {
    onToggleMode();
  };

  // 2. 수업 시작/종료 버튼 클릭 시
  const handleLessonButton = () => {
    if (isLessonStarted) {
      Alert.alert("수업 종료", "수업을 종료하시겠습니까?", [
        { text: "취소", style: "cancel" },
        { 
          text: "종료", 
          onPress: () => {
            dispatch(endLesson());
            onEndClass();
          } 
        }
      ]);
    } else {
      dispatch(startLesson());
      onStartClass();
    }
  };

  return (
    <View style={styles.headerContainer}>
      {/* 모드 토글 스위치 */}
      <View style={styles.toggleWrapper}>
        <Text style={[styles.toggleText, isTabletMode && styles.activeText]}>태블릿 수업</Text>
        <TouchableOpacity
          style={[styles.customSwitchTrack, !isTabletMode && styles.trackNormal]}
          activeOpacity={0.9}
          onPress={handleToggleSwitch}
        >
          <View style={[styles.customSwitchThumb, { alignSelf: isTabletMode ? 'flex-start' : 'flex-end' }]} />
        </TouchableOpacity>
        <Text style={[styles.toggleText, !isTabletMode && styles.activeText]}>일반 수업</Text>
      </View>

      {/* 중앙 정보 */}
      <View style={styles.infoContainer}>
        <Text style={styles.classNameText}>{className}</Text>
        <Text style={styles.countText}>참여 학생: {participantCount}명</Text>
      </View>

      {/* 수업 시작/종료 버튼 */}
      <TouchableOpacity 
        style={[styles.actionButton, isLessonStarted ? styles.btnEnd : styles.btnStart]} 
        onPress={handleLessonButton}
      >
        <Text style={styles.actionButtonText}>
          {isLessonStarted ? "수업 종료" : "수업 시작"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// 스타일 유지
const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3EED4', // 배경색
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#D7CCC8',
  },
  toggleWrapper: { flexDirection: 'row', alignItems: 'center' },
  toggleText: { fontSize: 16, color: '#8D6E63', fontWeight: '600', marginHorizontal: 8 },
  activeText: { color: '#3E2723', fontWeight: 'bold' },
  customSwitchTrack: {
    width: 50, height: 28, borderRadius: 14, backgroundColor: '#7FA864', justifyContent: 'center', padding: 2
  },
  trackNormal: { backgroundColor: '#FFB74D' },
  customSwitchThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF', elevation: 2 },
  infoContainer: { alignItems: 'center' },
  classNameText: { fontSize: 20, fontWeight: 'bold', color: '#3E2723' },
  countText: { fontSize: 14, color: '#5D4037', marginTop: 2 },
  actionButton: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 25, elevation: 3, minWidth: 110, alignItems: 'center' },
  btnStart: { backgroundColor: '#7FA864' },
  btnEnd: { backgroundColor: '#FF7043' },
  actionButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});