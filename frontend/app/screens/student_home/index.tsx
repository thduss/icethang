import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function StudentTitleScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>수업에 집중하면 레벨이 올라가요!</Text>
      
      {/* 버튼들을 가로로 배치하기 위한 컨테이너 */}
      <View style={styles.buttonContainer}>
        <Pressable 
          style={styles.button} 
          onPress={() => router.push('/screens/Login')}
        >
          <Text style={styles.buttonText}>수업 시작하기</Text>
        </Pressable>

        <Pressable 
          style={styles.button} 
          onPress={() => router.push('/screens/Change_Theme')} // 필요시 경로 수정
        >
          <Text style={styles.buttonText}>테마 변경</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#000' 
  },
  title: { 
    fontSize: 40, 
    color: '#fff', 
    fontWeight: 'bold', 
    marginBottom: 50,
    textAlign: 'center' // 텍스트 중앙 정렬 추가
  },
  buttonContainer: {
    flexDirection: 'row', // 가로 정렬
    gap: 40,              // 버튼 사이 간격 (최신 RN 버전 지원)
  },
  button: { 
    backgroundColor: '#4A90E2', 
    paddingHorizontal: 60, // 가로 배치에 맞춰 패딩 조정
    paddingVertical: 30, 
    borderRadius: 10,
    minWidth: 250,         // 두 버튼의 크기를 똑같이 맞추기 위해 최소 너비 지정
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  }
});