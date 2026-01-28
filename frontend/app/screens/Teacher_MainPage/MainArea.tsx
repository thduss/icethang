import { StyleSheet, Text, View, Pressable, Image, ImageBackground, ImageSourcePropType } from 'react-native'
import { router } from 'expo-router'

interface ActionCardProps {
  title: string
  image: ImageSourcePropType
  imageSize?: number  
  titleMarginTop?: number
  imageMarginTop?: number
  onPress?: () => void
}

// ActionCard 컴포넌트
const ActionCard = ({ title, image, imageSize = 160, titleMarginTop = 0, imageMarginTop = 0, onPress }: ActionCardProps) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <ImageBackground
        source={require("../../../assets/Teacher_Home3.png")}
        style={styles.cardBackground}
        imageStyle={styles.cardBackgroundImage}
        resizeMode="stretch"
      >
        <Image
          source={require("../../../assets/Teacher_Home4.png")}
          resizeMode="stretch"
          style={styles.cardOverlay}
        />
        <View style={styles.cardContent}>
          <Image
            source={image}
            resizeMode="contain"
            style={{
              width: imageSize,
              height: imageSize,
              marginTop: imageMarginTop,
            }}
          />
          <Text style={[styles.cardText, {marginTop: titleMarginTop}, ]}>{title}</Text>
        </View>
      </ImageBackground>
    </Pressable>
  )
}


const MainArea = () => {
  return (
    <View style={styles.row}>
      <ActionCard
        title="학생 관리"
        image={require("../../../assets/Teacher_Home2.png")}
        imageSize={235}
        // imageMarginTop={6}
        titleMarginTop={25}
        onPress={() => router.push('/screens/Teacher_ChildManage')}
      />
      <ActionCard
        title="수업 시작하기"
        image={require("../../../assets/Teacher_Home1.png")}
        imageSize={290}
        imageMarginTop={-10}
        titleMarginTop={-10}
        onPress={() => router.push('/screens/Teacher_Lesson')}
      />
    </View>
  )
}

export default MainArea

const styles = StyleSheet.create({
  card: {
    width: 400,
    height: 400,
    marginHorizontal: 40,
    marginTop: 20,
    marginBottom: 20,
  },

  cardBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },

  cardBackgroundImage: {
    borderRadius: 24,
    transform: [{ translateY: -32 }, { translateX: -36 }],
  },

  cardContent: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  cardOverlay: {
    position: "absolute",
  },

  image: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },

  cardText: {
    fontSize: 35,
    fontWeight: "700",
    color: "#111111",
  },

  row: {
    flex: 1,
    flexDirection: "row",   
    justifyContent: "center",    
    alignItems: "center",
    gap: 20,
  },
})
