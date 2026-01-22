import { StyleSheet, Text, View, Pressable, Image, ImageSourcePropType } from 'react-native'

// ActionCard 컴포넌트가 받을 props 타입 정의함
// - title: 카드에 표시할 텍스트
interface ActionCardProps {
  title: string
  image: ImageSourcePropType
  imageSize?: number  // 이미지 크기 (선택임)
  titleMarginTop?: number
}

// ActionCard 컴포넌트
const ActionCard = ({ title, image, imageSize = 160, titleMarginTop = 0 }: ActionCardProps) => {
  return (
    <Pressable style={styles.card}>
      <Image
        source={image}
        resizeMode="contain"
        style={{
          width: imageSize,
          height: imageSize,
        }}
      />
      {/* 카드 제목 텍스트 */}
      <Text style={[styles.cardText, {marginTop: titleMarginTop}, ]}>{title}</Text>
    </Pressable>
  )
}


// ActionCard들을 가로로 배치하는 영역
const MainArea = () => {
  return (
    // row : 카드들을 row(가로) 방향으로 정렬
    <View style={styles.row}>
      <ActionCard
        title="학생 관리"
        image={require("../../../assets/03_선생_홈화면2.png")}
        imageSize={200}
        titleMarginTop={20}
      />
      <ActionCard
        title="수업 시작하기"
        image={require("../../../assets/03_선생_홈화면1.png")}
        imageSize={250}
        titleMarginTop={-10}
      />
    </View>
  )
}

export default MainArea

const styles = StyleSheet.create({
  // ActionCard 전체 스타일
  card: {
    width: 400,
    height: 400,
    backgroundColor: "#F7F4F4",
    borderRadius: 24,   // 둥근 모서리
    paddingVertical: 32,    // 내부 여백
    paddingHorizontal: 24,
    alignItems: "center",   // 내부 요소 가로 중앙 정렬
    justifyContent: "center",
    marginHorizontal: 40,   // 좌우 여백
    marginTop: 20,    // 위 여백
    marginBottom: 20,   // 아래 여백
    borderWidth: 4,   // 테두리 두께
    borderColor: "#95A6B6",  // 테두리 색
  },

  // 버튼 이미지 부분
  image: {
    width: 160,
    height: 160,
    marginBottom: 16,
  },

  // 카드 제목 텍스트
  cardText: {
    fontSize: 35,
    fontWeight: "bold",
  },
  row: {
    flex: 1,
    flexDirection: "row",   // 가로 방향 배치
    justifyContent: "center",    // 카드 사이를 균등 분배
    alignItems: "center",
    gap: 20,
  },
})