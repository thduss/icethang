import { StyleSheet, Text, View, Pressable, Modal, TextInput, Alert, ActivityIndicator } from 'react-native'
import { useState, useEffect } from 'react'
import DraggableFlatList from 'react-native-draggable-flatlist'
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/stores';
import { addClass, resetStatus, fetchClasses, fetchClassDetail, deleteClass } from '../../store/slices/classSlice';
import { clearStudents } from '../../store/slices/memberSlice'; 

const LeftSidebar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, success, error, items, selectedClassId } = useSelector((state: RootState) => state.class || {});

  const [classes, setClasses] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [grade, setGrade] = useState('');
  const [classNum, setClassNum] = useState('');

  // 1. 초기 로드
  useEffect(() => {
    dispatch(fetchClasses());
  }, []);

  // 2. 목록 업데이트
  useEffect(() => {
    if (items && Array.isArray(items)) {
      setClasses(items);
    } else {
      setClasses([]);
    }
  }, [items]);

  // 3. 성공/실패 처리
  useEffect(() => {
    if (success) {
      Alert.alert('성공', '작업이 완료되었습니다!');
      dispatch(fetchClasses()); 
      setGrade('');
      setClassNum('');
      setModalVisible(false);
      dispatch(resetStatus());
    }
    if (error) {
      const errorMessage = typeof error === 'string' ? error : '알 수 없는 오류가 발생했습니다.';
      Alert.alert('오류', errorMessage);
      dispatch(resetStatus());
    }
  }, [success, error]);

  const handleAddClass = () => {
    if (!grade || !classNum) {
      Alert.alert('알림', '학년과 반을 모두 입력해주세요.');
      return;
    }
    dispatch(addClass({
      grade: parseInt(grade, 10),
      classNum: parseInt(classNum, 10)
    }));
  };

  // 학급 삭제 시 학생 목록도 즉시 비움
  const handleDeleteClass = (classId: number, className: string) => {
    Alert.alert(
      "반 삭제",
      `'${className}' 반을 정말 삭제하시겠습니까?\n삭제 시 소속 학생 데이터도 화면에서 제거됩니다.`,
      [
        { text: "취소", style: "cancel" },
        { 
          text: "삭제", 
          style: "destructive", 
          onPress: () => {
            // 1. 백엔드에 학급 삭제 요청
            dispatch(deleteClass(classId));
            // 2. 프론트엔드 학생 목록 상태 즉시 초기화
            dispatch(clearStudents());
          }
        }
      ]
    );
  };

  const renderItem = ({ item, drag, isActive }: any) => {
    const itemId = item.classId;    
    const isSelected = selectedClassId === itemId;
    const className = `${item.grade}-${item.classNum}`;

    return (
      <View style={[styles.shadowWrapper, isActive && styles.dragging]}>
        <Pressable
          // 길게 누르면 삭제 확인창 호출
          onLongPress={() => handleDeleteClass(itemId, className)}
          onPressIn={drag}
          onPress={() => {            
            dispatch(fetchClassDetail(itemId))
          }}
          style={[styles.innerButton, isSelected && styles.selectedInner]}
        >
          <Text style={styles.classText}>
            {className}
          </Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.sidebar}>
      <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
        <DraggableFlatList
          data={classes}
          keyExtractor={(item, index) => String(item.classId || index)}
          renderItem={renderItem}
          onDragEnd={({ data }) => setClasses(data)}
          contentContainerStyle={styles.classList}
        />
      </View>

      <View style={{ paddingBottom: 30 }}>
        <Pressable style={styles.manageButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.manageButtonText}>학급 관리</Text>
        </Pressable>
      </View>

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>학급 관리</Text>
            <TextInput
              placeholder="학년"
              value={grade}
              onChangeText={setGrade}
              style={styles.input}
              keyboardType="number-pad"
            />
            <TextInput
              placeholder="반"
              value={classNum}
              onChangeText={setClassNum}
              style={styles.input}
              keyboardType="number-pad"
            />

            {loading ? (
              <ActivityIndicator color="#CBB076" style={{ marginTop: 10 }} />
            ) : (
              <Pressable style={styles.modalButton} onPress={handleAddClass}>
                <Text style={styles.btnText}>학급 추가</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.modalButton, { backgroundColor: '#8D7B68', marginTop: 10 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.btnText, { color: '#FFF' }]}>닫기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default LeftSidebar;

const styles = StyleSheet.create({
  sidebar: { width: 140, backgroundColor: "#EBE0CC", height: '100%', alignItems: 'center', zIndex: 1 },
  classList: { paddingTop: 40, paddingBottom: 20, paddingHorizontal: 25, alignItems: "center" },
  shadowWrapper: { width: 90, height: 90, marginBottom: 20, borderRadius: 30, backgroundColor: '#FFFEF5', elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 5 },
  innerButton: { width: '100%', height: '100%', borderRadius: 30, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFEF5" },
  selectedInner: { backgroundColor: "#DCC486" },
  dragging: { opacity: 0.7, transform: [{ scale: 1.05 }] },
  classText: { fontSize: 28, fontWeight: '800', color: '#38220F' },
  manageButton: { width: 110, height: 50, backgroundColor: "#CBB076", borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 5 },
  manageButtonText: { fontSize: 18, fontWeight: "700", color: "#38220F" },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: 300, backgroundColor: '#FFFDF5', borderRadius: 20, padding: 30, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 24, fontWeight: '700', marginBottom: 20, color: '#38220F' },
  input: { width: '100%', height: 50, backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 15, marginBottom: 12, fontSize: 16 },
  modalButton: { width: '100%', height: 50, borderRadius: 12, backgroundColor: '#DCC486', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnText: { fontSize: 18, fontWeight: '700', color: '#38220F' }
});