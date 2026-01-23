import { StyleSheet, Text, View, Pressable, Image, ImageSourcePropType } from 'react-native'
import { router } from 'expo-router'

interface ActionCardProps {
  title: string
  image: ImageSourcePropType
  imageSize?: number  
  titleMarginTop?: number
  onPress?: () => void
}

// ActionCard 컴포넌트
const ActionCard = ({ title, image, imageSize = 160, titleMarginTop = 0, onPress }: ActionCardProps) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
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


const MainArea = () => {
  return (
    <View style={styles.row}>
      <ActionCard
        title="학생 관리"
        image={require("../../../assets/Teacher_Home2.png")}
        imageSize={200}
        titleMarginTop={20}
        onPress={() => router.push('/screens/Teacher_ChildManage')}
      />
      <ActionCard
        title="수업 시작하기"
        image={require("../../../assets/Teacher_Home1.png")}
        imageSize={250}
        titleMarginTop={-10}
      />
    </View>
  )
}

export default MainArea

const styles = StyleSheet.create({

  card: {
    width: 400,
    height: 400,
    backgroundColor: "#F7F4F4",
    borderRadius: 24,   
    paddingVertical: 32,    
    paddingHorizontal: 24,
    alignItems: "center",   
    justifyContent: "center",
    marginHorizontal: 40,  
    marginTop: 20, 
    marginBottom: 20,   
    borderWidth: 4,   
    borderColor: "#95A6B6", 
  },

  image: {
    width: 160,
    height: 160,
    marginBottom: 16,
  },

  cardText: {
    fontSize: 35,
    fontWeight: "bold",
  },
  row: {
    flex: 1,
    flexDirection: "row",   
    justifyContent: "center",    
    alignItems: "center",
    gap: 20,
  },
})