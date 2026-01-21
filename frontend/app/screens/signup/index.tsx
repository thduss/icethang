import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '../../services/auth'; // 👈 서비스 불러오기

export default function TeacherSignupScreen() {
  const router = useRouter();
  
  // 입력값 상태 관리
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pwCheck, setPwCheck] = useState('');
  const [school, setSchool] = useState('');
  const [agree, setAgree] = useState(false);

  // 🆕 회원가입 처리 함수
  const handleSignup = async () => {
    // 1. 유효성 검사
    if (!name || !email || !pw || !school) {
      Alert.alert("알림", "모든 정보를 입력해주세요.");
      return;
    }
    if (pw !== pwCheck) {
      Alert.alert("알림", "비밀번호가 서로 다릅니다.");
      return;
    }
    if (!agree) {
      Alert.alert("알림", "이용약관에 동의해주세요.");
      return;
    }

    // 2. 실제 가입 요청 (AuthService)
    const success = await AuthService.registerTeacher(email, pw, name, school);

    if (success) {
      Alert.alert("가입 성공! 🎉", "로그인 화면으로 이동합니다.", [
        { text: "확인", onPress: () => router.back() }
      ]);
    } else {
      Alert.alert("가입 실패", "이미 존재하는 이메일입니다.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.cloudCard}>
        <Text style={styles.title}>교사 회원가입</Text>
        
        <TextInput style={styles.input} placeholder="👤 이름" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="✉️ 이메일" keyboardType="email-address" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="🔒 비밀번호" secureTextEntry value={pw} onChangeText={setPw} />
        <TextInput style={styles.input} placeholder="🔒 비밀번호 확인" secureTextEntry value={pwCheck} onChangeText={setPwCheck} />
        <TextInput style={styles.input} placeholder="🏫 소속 학교" value={school} onChangeText={setSchool} />

        <TouchableOpacity style={styles.checkboxContainer} onPress={() => setAgree(!agree)}>
          <View style={[styles.checkbox, agree && { backgroundColor: '#5D9CEC' }]} />
          <Text style={styles.checkboxText}>이용약관 동의</Text>
        </TouchableOpacity>

        {/* 버튼에 함수 연결 */}
        <TouchableOpacity style={styles.signupBtn} onPress={handleSignup}>
          <Text style={styles.btnText}>가입하기</Text>
        </TouchableOpacity>

        {/* ... (나머지 소셜 버튼 등은 기존과 동일) ... */}
        <Text style={styles.orText}>또는</Text>
        <TouchableOpacity onPress={() => router.back()} style={{marginTop: 15}}><Text style={{color: '#999'}}>뒤로가기</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ... styles는 기존과 동일 ...
const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5', paddingVertical: 40 },
  cloudCard: { width: '90%', backgroundColor: 'white', borderRadius: 40, padding: 30, alignItems: 'center', elevation: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#7986CB', marginBottom: 25 },
  input: { width: '100%', height: 50, backgroundColor: '#E8EAF6', borderRadius: 25, paddingHorizontal: 20, marginBottom: 12 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20, paddingLeft: 10 },
  checkbox: { width: 20, height: 20, borderWidth: 2, borderColor: '#5D9CEC', borderRadius: 5, marginRight: 10 },
  checkboxText: { color: '#666' },
  signupBtn: { width: '100%', height: 50, backgroundColor: '#7986CB', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  orText: { marginVertical: 15, color: '#AAA' }
});