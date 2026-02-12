import { StyleSheet, Text, View, Pressable, Image, ImageBackground, ImageSourcePropType, Alert, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/stores'

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SIZE = SCREEN_WIDTH * 0.3;

interface ActionCardProps {
  title: string
  image: ImageSourcePropType
  imageSize: number
  onPress?: () => void
}

const ActionCard = ({ title, image, imageSize, onPress }: ActionCardProps) => {
  return (
    <Pressable onPress={onPress} style={styles.cardContainer}>
      <ImageBackground
        source={require("../../../assets/Teacher_Home4.png")} 
        style={{ width: CARD_SIZE, height: CARD_SIZE }}
        imageStyle={{ borderRadius: 30 }}
        resizeMode="stretch"
      >
        <View style={styles.cardContent}>
          <Image
            source={image}
            resizeMode="contain"
            style={{
              width: imageSize * (CARD_SIZE / 420), 
              height: imageSize * (CARD_SIZE / 420),
              marginBottom: 20,
            }}
          />
          <Text style={[styles.cardText, { fontSize: CARD_SIZE * 0.08 }]}>
            {title}
          </Text>
        </View>
      </ImageBackground>
    </Pressable>
  )
}

const MainArea = () => {
  const { selectedClassId, items } = useSelector((state: RootState) => state.class || {});

  const handleStartClass = () => {
    if (!selectedClassId) {
      Alert.alert("알림", "수업을 시작할 반을 선택해주세요!");
      return;
    }
    const selectedClass = items?.find((c: any) => c.classId === selectedClassId);
    router.push({
      pathname: '/screens/Teacher_Lesson',
      params: {
        classId: selectedClassId,
        className: selectedClass ? `${selectedClass.grade}학년 ${selectedClass.classNum}반` : ""
      }
    });
  };

  return (
    <View style={styles.row}>
      <ActionCard
        title="학생 관리"
        image={require("../../../assets/Teacher_Home2.png")}
        imageSize={220}
        onPress={() => router.push('/screens/Teacher_ChildManage')}
      />
      <ActionCard
        title="수업 시작하기"
        image={require("../../../assets/Teacher_Home1.png")}
        imageSize={260}
        onPress={handleStartClass}
      />
    </View>
  )
}

export default MainArea

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SCREEN_WIDTH * 0.04, 
  },
  cardContainer: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    backgroundColor: 'white',
    borderRadius: 30,
  },
  cardContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  cardText: {
    fontWeight: "800",
    color: "#111111",
    textAlign: 'center',
  },
})