import { StyleSheet, Text, View, Pressable, Modal, TextInput, Alert, ActivityIndicator } from 'react-native'
import { useState, useEffect } from 'react'
import DraggableFlatList from 'react-native-draggable-flatlist'
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/stores'; 
import { addClass, resetStatus, fetchClasses } from '../../store/slices/classSlice'; 

const LeftSidebar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, success, error, items } = useSelector((state: RootState) => state.class || {});

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [grade, setGrade] = useState('');
  const [classNum, setClassNum] = useState('');

  useEffect(() => {
    dispatch(fetchClasses());
  }, []);

  useEffect(() => {
    if (items && Array.isArray(items)) {
      setClasses(items);
    } else {
      setClasses([]);
    }
  }, [items]);

  useEffect(() => {
    if (success) {
      Alert.alert('성공', '새로운 반이 생성되었습니다!');
      dispatch(fetchClasses());
      setGrade('');
      setClassNum('');
      setModalVisible(false);
      dispatch(resetStatus());
    }
    if (error) {
      Alert.alert('오류', String(error));
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

  const renderItem = ({ item, drag, isActive }: any) => {
    const itemId = item.id || item.schoolClassId || `${item.grade}-${item.classNum}`
    const isSelected = selectedClassId === itemId; 
    
    return (
      <View
        style={[
          styles.shadowWrapper,
          isActive && styles.dragging,
        ]}
      >
        <Pressable
          onLongPress={drag}
          onPress={() => setSelectedClassId(itemId)}
          style={[
            styles.innerButton,
            isSelected && styles.selectedInner, 
          ]}
        >
          <Text style={styles.classText}>
            {item.grade}-{item.classNum}
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
          keyExtractor={(item, index) => {
            const key = item.id || item.schoolClassId || `${item.grade}-${item.classNum}` || index;
            return String(key);
          }}
          renderItem={renderItem}
          onDragEnd={({ data }) => setClasses(data)}
          
          contentContainerStyle={styles.classList}
          clipChildren={false} 
          overflow="visible"
        />
      </View>

      <View style={{ paddingBottom: 30 }}> 
        <Pressable
          style={styles.manageButton}
          onPress={() => setModalVisible(true)}
        >
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
  sidebar: { 
    width: 140, 
    backgroundColor: "#EBE0CC",
    height: '100%',
    alignItems: 'center',
    zIndex: 1,
  },
  
  classList: { 
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 25,
    alignItems: "center" 
  },

  shadowWrapper: {
    width: 90, 
    height: 90, 
    marginBottom: 20, 
    borderRadius: 30,
    backgroundColor: '#FFFEF5',
    
    elevation: 6, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },

  innerButton: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#FFFEF5",
  },

  selectedInner: { 
    backgroundColor: "#DCC486",
  },

  dragging: { 
    opacity: 0.7, 
    transform: [{ scale: 1.05 }] 
  },

  classText: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#38220F',
  },

  manageButton: { 
    width: 110,
    height: 50,
    backgroundColor: "#CBB076",
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },

  manageButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#38220F",
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: 300, backgroundColor: '#FFFDF5', borderRadius: 20, padding: 30, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 24, fontWeight: '700', marginBottom: 20, color: '#38220F' },
  input: { width: '100%', height: 50, backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 15, marginBottom: 12, fontSize: 16 },
  modalButton: { width: '100%', height: 50, borderRadius: 12, backgroundColor: '#DCC486', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnText: { fontSize: 18, fontWeight: '700', color: '#38220F' }
});