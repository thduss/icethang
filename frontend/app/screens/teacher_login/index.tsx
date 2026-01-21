import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '../../services/auth';

export default function TeacherLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  const handleLogin = async () => {
    const result = await AuthService.teacherLogin(email, pw);
    if (result.success) router.replace('/screens/teacher_home');
    else Alert.alert("로그인 실패", result.msg);
  };

  return (
    <View style={styles.container}>
      <View style={styles.cloudCard}>
        <Text style={styles.title}>교사 로그인</Text>
        
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} placeholder="✉️ 이메일" 
            value={email} onChangeText={setEmail} autoCapitalize="none" 
          />
          <TextInput 
            style={styles.input} placeholder="🔒 비밀번호" 
            value={pw} onChangeText={setPw} secureTextEntry 
          />
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.btnText}>로그인</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>또는 소셜 로그인</Text>

        <View style={styles.socialRow}>
          <TouchableOpacity style={[styles.iconBtn, {backgroundColor: '#FEE500'}]}><Text>💬</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, {backgroundColor: '#03C75A'}]}><Text style={{color:'white'}}>N</Text></TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/screens/signup')} style={{ marginTop: 20 }}>
          <Text style={{ color: '#888', textDecorationLine: 'underline' }}>회원가입</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E3F2FD' },
  cloudCard: { 
    width: '85%', backgroundColor: 'white', borderRadius: 50, padding: 30, alignItems: 'center',
    borderWidth: 5, borderColor: '#BBDEFB', elevation: 10 
  },
  title: { fontSize: 28, fontWeight: '900', color: '#555', marginBottom: 20 },
  inputContainer: { width: '100%', marginBottom: 15 },
  input: { width: '100%', height: 50, backgroundColor: '#F0F4F8', borderRadius: 25, paddingHorizontal: 20, marginBottom: 10 },
  loginBtn: { width: '100%', height: 50, backgroundColor: '#7986CB', borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  orText: { color: '#AAA', marginBottom: 15 },
  socialRow: { flexDirection: 'row', gap: 15 },
  iconBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' }
});