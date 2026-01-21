import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '../../services/auth';

export default function StudentLoginScreen() {
  const router = useRouter();
  const [grade, setGrade] = useState('');
  const [classNum, setClassNum] = useState('');
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleLogin = async () => {
    const result = await AuthService.studentLogin(grade, classNum, number, name, code);
    if (result.success) router.replace('/screens/student_home');
    else Alert.alert("입장 실패", result.msg);
  };

  return (
    <View style={styles.container}>
      <View style={styles.cloudCard}>
        <Text style={styles.title}>✨ 입장하기 ✨</Text>

        <View style={styles.row}>
          <View style={styles.smallBox}>
            <Text style={styles.label}>반</Text>
            <TextInput style={styles.smallInput} keyboardType="number-pad" placeholder="1" onChangeText={setClassNum} />
          </View>
          <Text style={{fontSize: 20, marginTop: 25}}>🏫</Text>
          <View style={styles.smallBox}>
            <Text style={styles.label}>번호</Text>
            <TextInput style={styles.smallInput} keyboardType="number-pad" placeholder="15" onChangeText={setNumber} />
          </View>
        </View>

        <View style={styles.longBox}>
          <Text style={styles.label}>이름</Text>
          <TextInput style={styles.input} placeholder="이름을 입력하세요" onChangeText={setName} />
        </View>

        <View style={styles.longBox}>
          <Text style={styles.label}>인증코드</Text>
          <TextInput style={[styles.input, {backgroundColor: '#FFF9C4'}]} placeholder="코드 입력" onChangeText={setCode} />
        </View>

        <TouchableOpacity style={styles.enterBtn} onPress={handleLogin}>
          <Text style={styles.btnText}>입 장</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={{marginTop: 15}}>
          <Text style={{color: '#999'}}>뒤로가기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8E1' },
  cloudCard: { 
    width: '85%', backgroundColor: 'white', borderRadius: 40, padding: 30, alignItems: 'center',
    borderWidth: 5, borderColor: '#B3E5FC', elevation: 10
  },
  title: { fontSize: 26, fontWeight: '900', color: '#5D9CEC', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  smallBox: { alignItems: 'center' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 5 },
  smallInput: { width: 60, height: 50, backgroundColor: '#F0F4F8', borderRadius: 15, textAlign: 'center', fontSize: 18 },
  longBox: { width: '100%', marginBottom: 15 },
  input: { width: '100%', height: 50, backgroundColor: '#F0F4F8', borderRadius: 15, paddingHorizontal: 15, fontSize: 16 },
  enterBtn: { width: '100%', height: 55, backgroundColor: '#7986CB', borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnText: { color: 'white', fontSize: 20, fontWeight: 'bold' }
});