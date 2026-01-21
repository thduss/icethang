// 로그인 페이지
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title} className='font-yeogi'>로그인화면</Text>
      
      <Pressable 
        style={styles.button} 
        onPress={() => router.push('/screens/Signup')}
      >
        <Text style={styles.buttonText}>로그인</Text>
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