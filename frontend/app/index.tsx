import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import "../global.css"
export default function TitleScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>메인화면</Text>
       <Text className="text-xl font-bold text-blue-500">테일윈드 돌아가는지 체크좀하자</Text>
      <Pressable 
        style={styles.button} 
        onPress={() => router.push('/screens/login')}
      >
        <Text style={styles.buttonText}>게임 시작</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  title: { fontSize: 40, color: '#fff', fontWeight: 'bold', marginBottom: 50 },
  button: { backgroundColor: '#4A90E2', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});