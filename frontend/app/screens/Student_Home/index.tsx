import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ImageBackground,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function StudentTitleScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../../../assets/Student_Home5.png')}
        style={styles.titleBanner}
        imageStyle={styles.titleBannerImage}
        resizeMode="stretch"
      >
        <Text style={styles.title}>
          수업에 집중하면 레벨이 올라가요!
        </Text>
      </ImageBackground>

      <View style={styles.cardRow}>
        <Pressable
          style={styles.card}
          onPress={() => router.push('/screens/Student_oading')}
        >
          <ImageBackground
            source={require('../../../assets/Student_Home3.png')}
            style={styles.cardBackground}
            imageStyle={styles.cardBackgroundImage}
            resizeMode="stretch"
          >
            <Image
              source={require('../../../assets/Student_Home1.png')}
              style={styles.cardCharacter_1}
              resizeMode="contain"
            />
            <View style={[styles.cardButton, styles.cardButtonBlue]}>
              <Text style={styles.cardButtonText}>수업 시작하기</Text>
            </View>
          </ImageBackground>
        </Pressable>

        <Pressable
          style={styles.card}
          onPress={() => router.push('/screens/Change_Theme')}
        >
          <ImageBackground
            source={require('../../../assets/Student_Home4.png')}
            style={styles.cardBackground}
            imageStyle={styles.cardBackgroundImage}
            resizeMode="stretch"
          >
            <Image
              source={require('../../../assets/Student_Home2.png')}
              style={styles.cardCharacter_2}
              resizeMode="contain"
            />
            <View style={[styles.cardButton, styles.cardButtonGold]}>
              <Text style={styles.cardButtonText}>테마 변경</Text>
            </View>
          </ImageBackground>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f2ef',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 32,
  },

  titleBanner: {
    width: '100%',
    maxWidth: 760,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },

  titleBannerImage: {
    borderRadius: 28,
  },

  title: {
    fontSize: 28,
    color: '#6b5b4b',
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 24,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  cardRow: {
    width: '100%',
    maxWidth: 880,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    columnGap: 36,
    rowGap: 32,
  },

  card: {
    width: 380,
    maxWidth: 360,
  },

  cardBackground: {
    width: '100%',
    height: 330,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
  },

  cardBackgroundImage: {
    borderRadius: 26,
  },

  cardCharacter_1: {
    width: '75%',
    height: 190,
    marginTop: 10,
  },

  cardCharacter_2: {
    width: '75%',
    height: 180,
    marginLeft: 18,
    marginTop: 7
  },

  cardButton: {
    minWidth: '80%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  cardButtonBlue: {
    backgroundColor: '#a7c9df',
    marginBottom: 10,
  },

  cardButtonGold: {
    backgroundColor: '#e5c27a',
    marginBottom: 10,
  },

  cardButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
});
