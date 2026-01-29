import { StyleSheet, Text, View, Pressable, Image, ImageBackground, ImageSourcePropType } from 'react-native'
import { router } from 'expo-router'

const CARD_OUTER_SIZE = 435;
const CARD_INNER_SIZE = 420;

interface ActionCardProps {
  title: string
  image: ImageSourcePropType
  imageSize?: number
  titleMarginTop?: number
  imageMarginTop?: number
  onPress?: () => void
}

const ActionCard = ({ title, image, imageSize = 160, titleMarginTop = 0, imageMarginTop = 0, onPress }: ActionCardProps) => {
  return (
    <Pressable onPress={onPress}>
      <ImageBackground
        source={require("../../../assets/Teacher_Home3.png")}
        style={styles.outerBackground}
        resizeMode="stretch" 
      >
        <ImageBackground
            source={require("../../../assets/Teacher_Home4.png")}
            style={styles.innerCardBackground}
            resizeMode="stretch"
        >
            <View style={styles.cardContent}>
            <Image
                source={image}
                resizeMode="contain"
                style={{
                width: imageSize,
                height: imageSize,
                marginTop: imageMarginTop,
                marginBottom: 10, 
                }}
            />
            <Text style={[styles.cardText, { marginTop: titleMarginTop }]}>
                {title}
            </Text>
            </View>
        </ImageBackground>
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
        titleMarginTop={15}
        onPress={() => router.push('/screens/Teacher_ChildManage')}
      />
      <ActionCard
        title="수업 시작하기"
        image={require("../../../assets/Teacher_Home1.png")}
        imageSize={290}
        imageMarginTop={-10}
        titleMarginTop={-5}
        onPress={() => router.push('/screens/Teacher_Lesson')}
      />
    </View>
  )
}

export default MainArea

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 40,
  },

  outerBackground: {
    width: CARD_OUTER_SIZE,
    height: CARD_OUTER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },

  innerCardBackground: {
    width: CARD_INNER_SIZE,
    height: CARD_INNER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardContent: {
    alignItems: "center",
    justifyContent: "center",
  },

  cardText: {
    fontSize: 35,
    fontWeight: "700",
    color: "#111111",
    textAlign: 'center',
  },
})