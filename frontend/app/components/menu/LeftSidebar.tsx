// 교사용 공용 메뉴 (왼쪽 사이드바) 

import { StyleSheet, Text, View, Pressable, Modal, TextInput } from 'react-native'
import { useState } from 'react'

const classes = ["1-1", "1-2", "1-3", "1-4"]

const LeftSidebar = () => {
  // selected : 현재 선택된 반 (처음 값은 "1-1")
  // setSelected : selected 값을 바꾸는 함수
  const [selected, setSelected] = useState("1-1")
  const [modalVisible, setModalVisible] = useState(false)
  const [grade, setGrade] = useState('')
  const [classNum, setClassNum] = useState('')

  return (
    <>
      {/* 왼쪽 사이드바 */}
      <View style={styles.sidebar}>
        <View style={styles.classList}>
          {/* 
      - map으로 반 버튼 만들기 
      - classes 배열을 하나씩 돌면서
      - Pressable 버튼 자동 생성
      */}
          {classes.map((cls) => (
            <Pressable
              key={cls}
              style={[
                styles.classButton,
                selected === cls && styles.selected,
              ]}
              onPress={() => setSelected(cls)}
            >
              <Text style={styles.classText}>{cls}</Text>
            </Pressable>
          ))}
        </View>

        {/* 학급 관리 버튼 */}
        <Pressable
          style={styles.manageButton}
          onPress={() => setModalVisible(true)}
        >
          <Text>학급 관리</Text>
        </Pressable>
      </View>

      {/* ============================================================================= */}

      {/* 학급 관리 모달 */}
      <Modal
        transparent             // 배경 투명
        animationType='fade'    // 부드럽게 나타남
        visible={modalVisible}  // true면 보임
        onRequestClose={() => setModalVisible(false)} // 안드로이드 뒤로가기 대응
      >
        {/* 모달 배경의 어두운 부분 */}
        <View style={styles.modalOverlay}>
          {/* 실제 모달 박스 */}
          <View style={styles.modalBox}>
            {/* 모달 제목 */}
            <View style={styles.titleWrapper}>
              <Text style={styles.modalTitle}>학급 관리</Text>
            </View>

            {/* 학년 입력 */}
            <TextInput
              placeholder="학년을 입력하세요."
              value={grade}
              onChangeText={setGrade} // 입력값을 grade 상태에 저장
              style={styles.input}
            />

            {/* 반 입력 */}
            <TextInput
              placeholder="반을 입력하세요."
              value={classNum}
              onChangeText={setClassNum} // 입력값을 classNum 상태에 저장
              style={styles.input}
            />

            {/* 학급 추가 버튼 */}
            <Pressable style={styles.modalButton}>
              <Text style={styles.classButtonText}>학급 추가</Text>
            </Pressable>

            {/* 학급 삭제 버튼 */}
            <Pressable style={styles.modalButton}>
              <Text style={styles.classButtonText}>학급 삭제</Text>
            </Pressable>

            {/* 학급 비활성화 버튼 */}
            <Pressable style={styles.modalButton}>
              <Text style={styles.classButtonText}>학급 비활성화</Text>
            </Pressable>

            {/* 닫기 버튼 */}
            <Pressable
              style={styles.closeButton}
              onPress={() => setModalVisible(false)} // 모달 닫기
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
  // 사이드바 전체 영역 스타일
  sidebar: {
    width: 120,
    // 가로 너비
    paddingVertical: 20,
    // 위, 아래 안쪽 여백 (내용이 가장자리에 붙지 않게)
    justifyContent: "space-between",
    // 세로 방향으로
    // 위에는 반 버튼, 아래는 학급 관리 버튼 배치
    // 위, 아래 끝으로 벌려줌
    backgroundColor: "#E7D7B5"
  },

  // 반 버튼 묶는 컨테이너
  classList: {
    gap: 16,
    // 버튼 사이 간격
    // marginBottom을 하나하나 줄 필요 없이 자동 간격임
    alignItems: "center",
    // 가로 방향 가운데 정렬
  },
  // 클래스 글씨
  classText: {
    fontSize: 25,
    fontWeight: '700',
    color: '#270800',
  },

  // 기본 반 버튼
  classButton: {
    width: 70,
    // 버튼 가로 크기

    height: 70,
    // 버튼 세로 크기

    borderRadius: 20,
    // 둥근 모서리 만듦
    // (width / 2) = 완전 원형!

    borderWidth: 2,
    // 테두리 두께

    borderColor: "#270800",
    // 테두리 색상

    justifyContent: "center",
    // 세로 방향 중앙 정렬

    alignItems: "center",
    // 가로 방향 중앙 정렬

    backgroundColor: "#FCFDEB"

  },

  // 선택된 반 버튼
  selected: {
    backgroundColor: "#E3CA92"
  },

  // '학급 관리' 버튼
  manageButton: {
    alignSelf: "center",
    // 부모(View) 기준으로 가로 가운데 정렬

    padding: 15,
    // 버튼 안쪽 여백 (텍스트가 너무 붙지 않게)

    borderWidth: 2,
    // 테두리 두께

    borderColor: "#270800",
    // 테두리 색상

    borderRadius: 25,
    backgroundColor: "#E3CA92"
  },

  // 모달 배경 (어두운 영역)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 모달 박스
  modalBox: {
    width: 300,
    backgroundColor: '#F6F1E1',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },

  // 제목 배경 도형
  titleWrapper: {
    paddingHorizontal: 80,   // 좌우 여백 (도형 길이)
    paddingVertical: 8,      // 위아래 여백 (도형 두께)
    backgroundColor: '#685441', // 첫 번째 이미지 느낌의 진한 베이지/브라운
    borderRadius: 30,        // 알약 모양
    marginBottom: 20,
  },

  // 모달 제목 텍스트
  modalTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: "#FFF",
    textAlign: "center",
  },

  // 입력창
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#C4B28A',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#FFF',
  },

  // 모달 내부 버튼
  modalButton: {
    width: '100%',
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#E3CA92',
    alignItems: 'center',
    marginTop: 8,
  },

  // 닫기 버튼
  closeButton: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    backgroundColor: '#685441',
  },
  // 닫기 텍스트
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