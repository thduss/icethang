import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';

export default function SelectRoleScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>누구신가요?</Text>
      
      <View style={styles.cardContainer}>
        {/* 선생님 버튼 */}
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => router.push('/screens/teacher_login')}
        >
          <View style={styles.circleIcon}><Text style={{fontSize: 40}}>🐿️</Text></View>
          <Text style={styles.cardTitle}>선생님이에요!</Text>
          <View style={[styles.btn, {backgroundColor: '#8CB6F0'}]}>
            <Text style={styles.btnText}>선생님으로 시작하기</Text>
          </View>
        </TouchableOpacity>

        {/* 학생 버튼 */}
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => router.push('/screens/student_login')}
        >
          <View style={styles.circleIcon}><Text style={{fontSize: 40}}>🌱</Text></View>
          <Text style={styles.cardTitle}>학생이에요!</Text>
          <View style={[styles.btn, {backgroundColor: '#8CB6F0'}]}>
            <Text style={styles.btnText}>학생으로 시작하기</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDF6E3' }, // 따뜻한 배경색
  title: { fontSize: 24, fontWeight: 'bold', color: '#BCAAA4', marginBottom: 30 },
  cardContainer: { flexDirection: 'row', gap: 20 },
  card: { 
    width: 160, height: 220, backgroundColor: 'white', borderRadius: 30, 
    justifyContent: 'center', alignItems: 'center', padding: 15,
    elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5
  },
  circleIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#555', marginBottom: 15 },
  btn: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, width: '100%', alignItems: 'center' },
  btnText: { color: 'white', fontSize: 12, fontWeight: 'bold' }
});