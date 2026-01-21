import React from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '../../services/auth';

export default function TeacherHomeScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert("로그아웃", "정말 나가시겠습니까?", [
      { text: "취소", style: "cancel" },
      { 
        text: "확인", 
        onPress: async () => {
          await AuthService.logout();
          router.replace('/screens/select');
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>👩‍🏫</Text>
      <Text style={styles.title}>선생님 대시보드</Text>
      <Text style={styles.subtitle}>반갑습니다! 수업을 관리해보세요.</Text>
      
      <View style={styles.card}>
        <Text style={{color: '#888'}}>아직 연결된 수업이 없습니다.</Text>
      </View>

      <View style={{marginTop: 50, width: '100%', paddingHorizontal: 30}}>
        <Button title="로그아웃" onPress={handleLogout} color="#FF6B6B" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F8FF' },
  icon: { fontSize: 60, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  card: { width: '80%', height: 150, backgroundColor: 'white', borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3 }
});