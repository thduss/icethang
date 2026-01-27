import { StyleSheet, Text, View, Pressable, Modal, TextInput } from 'react-native'
import { useState } from 'react'
import DraggableFlatList from 'react-native-draggable-flatlist'

interface ClassItem {
  id: number
  grade: number
  classNum: number
  isActive: boolean
}

const LeftSidebar = () => {

  const [classes, setClasses] = useState<ClassItem[]>([
    { id: 1, grade: 1, classNum: 1, isActive: true },
    { id: 2, grade: 1, classNum: 2, isActive: true },
    { id: 3, grade: 1, classNum: 3, isActive: true },
    { id: 4, grade: 1, classNum: 4, isActive: true },
  ])

  const [selectedClassId, setSelectedClassId] = useState<number | null>(1)

  const [modalVisible, setModalVisible] = useState(false)
  const [grade, setGrade] = useState('')
  const [classNum, setClassNum] = useState('')

  // 학급 추가
  const handleAddClass = () => {
    if (!grade || !classNum) return

    const newClass: ClassItem = {
      id: Date.now(),
      grade: Number(grade),
      classNum: Number(classNum),
      isActive: true,
    }

    setClasses(prev => [...prev, newClass])
    setGrade('')
    setClassNum('')
    setModalVisible(false)
  }

  // 학급 삭제
  const handleDeleteClass = () => {
    if (!selectedClassId) return

    setClasses(prev => prev.filter(c => c.id !== selectedClassId))
    setSelectedClassId(null)
    setModalVisible(false)
  }

  // 학급 비활성화
  const handleDeactivateClass = () => {
    if (!selectedClassId) return

    setClasses(prev =>
      prev.map(c =>
        c.id === selectedClassId ? { ...c, isActive: false } : c
      )
    )
    setModalVisible(false)
  }


  const renderItem = ({ item, drag, isActive }: any) => {
    const label = `${item.grade}-${item.classNum}`

    return (
      <Pressable
        onLongPress={item.isActive ? drag : undefined}
        disabled={!item.isActive}
        onPress={() => setSelectedClassId(item.id)}
        style={[
          styles.classButton,
          selectedClassId === item.id && styles.selected,
          !item.isActive && styles.disabledClass,
          isActive && styles.dragging,
        ]}
      >
        <Text style={styles.classText}>{label}</Text>
      </Pressable>
    )
  }

  return (
    <>
      {/* 왼쪽 사이드바 */}
      <View style={styles.sidebar}>
        <View style={{ flex: 1 }}>
          <DraggableFlatList
            style={{ flex: 1 }}
            data={classes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            onDragEnd={({ data }) => setClasses(data)}
            contentContainerStyle={styles.classList}
          />
        </View>


        {/* 학급 관리 버튼 */}
        <Pressable
          style={styles.manageButton}
          onPress={() => setModalVisible(true)}
        >
          <Text>학급 관리</Text>
        </Pressable>
      </View>


      {/* 학급 관리 모달 */}
      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.titleWrapper}>
              <Text style={styles.modalTitle}>학급 관리</Text>
            </View>

            <TextInput
              placeholder="학년을 입력하세요."
              value={grade}
              onChangeText={setGrade}
              style={styles.input}
              keyboardType="number-pad"
            />

            <TextInput
              placeholder="반을 입력하세요."
              value={classNum}
              onChangeText={setClassNum}
              style={styles.input}
              keyboardType="number-pad"
            />

            <Pressable style={styles.modalButton} onPress={handleAddClass}>
              <Text style={styles.classButtonText}>학급 추가</Text>
            </Pressable>

            <Pressable style={styles.modalButton} onPress={handleDeleteClass}>
              <Text style={styles.classButtonText}>학급 삭제</Text>
            </Pressable>

            <Pressable style={styles.modalButton} onPress={handleDeactivateClass}>
              <Text style={styles.classButtonText}>학급 비활성화</Text>
            </Pressable>

            <Pressable
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>닫기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  )
}
export default LeftSidebar;

const styles = StyleSheet.create({

  sidebar: {
    width: 120,
    paddingVertical: 20,
    backgroundColor: "#E7D7B5"
  },

  disabledClass: {
    opacity: 0.4,
  },

  dragging: {
    opacity: 0.6,
    transform: [{ scale: 1.05 }],
  },

  classList: {
    alignItems: "center",
    paddingTop: 16,
  },

  classText: {
    fontSize: 25,
    fontWeight: '700',
    color: '#270800',
  },

  classButton: {
    width: 70,
    height: 70,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#270800",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FCFDEB",
    marginBottom: 16,
  },

  selected: {
    backgroundColor: "#E3CA92"
  },

  manageButton: {
    alignSelf: "center",
    padding: 15,
    borderWidth: 2,
    borderColor: "#270800",
    borderRadius: 25,
    backgroundColor: "#E3CA92"
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBox: {
    width: 310,
    backgroundColor: '#F6F1E1',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },

  titleWrapper: {
    paddingHorizontal: 80,
    paddingVertical: 8,
    backgroundColor: '#685441',
    borderRadius: 30,
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: "#FFF",
    textAlign: "center",
  },

  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#C4B28A',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#FFF',
  },

  modalButton: {
    width: '100%',
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#E3CA92',
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#b4aa94',
  },

  closeButton: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    backgroundColor: '#685441',
  },

  closeText: {
    color: "#FFF",
    fontWeight: 800,
  },

  classButtonText: {
    color: "#52381F",
    fontWeight: 500,
    fontSize: 15,
  }
})