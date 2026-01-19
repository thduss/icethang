// 얼음땡 캐릭터들 나오는 제일 처음 로딩 화면

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
export default function LoadingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>로딩화면</Text>
       <Text className="text-xl font-bold text-blue-500">테일윈드 뼈대용</Text>
      <Pressable 
        style={styles.button} 
        onPress={() => router.push('/screens/login')}
      >
        <Text style={styles.buttonText}>로딩 완료시 리다이렉트 시켜야함</Text>
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