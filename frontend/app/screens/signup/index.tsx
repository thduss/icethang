import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { login } from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';
import { initNaverLogin } from '../../utils/naverConfig';

// [추가] 아까 만든 AuthService 가져오기
import { AuthService } from '../../services/auth'; 

//  색상 설정
const CONFIG = {
  colors: {
    textTitle: '#AEC7EC', 
    inputBorder: '#D4E4F7',
    inputBg: '#F8FAFC',
    btnBackground: '#8CB6F0', 
    btnBorder: '#6A94D0',
  },
};

interface InputBoxProps {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  isPassword?: boolean;
  height: number;
  fontSize: number;
  color: string;
}

export default function SignupScreen() {
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [school, setSchool] = useState('');
  const [agreed, setAgreed] = useState(false);

  // [추가] 로딩 상태 관리
  const [loading, setLoading] = useState(false);

  // 동적 크기 계산
  const CARD_RATIO = 1.35;
  let finalWidth = Math.min(screenWidth * 0.75, 600);
  let finalHeight = finalWidth * CARD_RATIO;

  if (finalHeight > screenHeight * 0.85) {
    finalHeight = screenHeight * 0.85;
    finalWidth = finalHeight / CARD_RATIO;
  }

  const cardWidth = finalWidth;
  const cardHeight = finalHeight;
  
  const inputHeight = Math.min(cardHeight * 0.065, 50); 
  const fontSizeInput = Math.min(cardWidth * 0.04, 16);
  const titleSize = Math.min(cardWidth * 0.1, 40);
  const robotSize = Math.min(cardWidth * 0.4, 180); 
  const spacing = Math.min(cardHeight * 0.015, 10); 
  const paddingH = cardWidth * 0.14; 
  const paddingV = cardHeight * 0.08; 

  useEffect(() => {
    initNaverLogin();
  }, []);

  const handleKakaoSignup = async () => {
    try {
      const token = await login();
      console.log('카카오 가입 토큰:', token);
      Alert.alert("성공", "카카오 계정으로 가입되었습니다!\n로그인 해주세요.", [
        { text: "확인", onPress: () => router.replace('/screens/Teacher_Login') }
      ]);
    } catch (err) {
      console.error("카카오 가입 에러:", err);
      Alert.alert("실패", "카카오 가입 중 오류가 발생했습니다.");
    }
  };

  const handleNaverSignup = async () => {
    try {
      const { successResponse, failureResponse } = await NaverLogin.login();
      if (successResponse) {
        console.log("네이버 가입 토큰:", successResponse.accessToken);
        Alert.alert("성공", "네이버 계정으로 가입되었습니다!\n로그인 해주세요.", [
          { text: "확인", onPress: () => router.replace('/screens/Teacher_Login') }
        ]);
      } else {
        console.log("네이버 가입 실패", failureResponse);
      }
    } catch (err) {
      console.error("네이버 가입 에러:", err);
    }
  };

  // [수정됨] 실제 서버 회원가입 로직
  const handleSignup = async () => {
    // 1. 입력값 검증
    if (!name || !email || !password || !school) {
      Alert.alert("알림", "모든 정보를 입력해주세요.");
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert("알림", "비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!agreed) {
      Alert.alert("알림", "이용약관에 동의해주세요.");
      return;
    }

    // 2. 로딩 시작
    setLoading(true);

    try {
      // 3. AuthService를 통해 서버로 전송
      // (registerTeacher 함수: email, pw, name, school 순서)
      const isSuccess = await AuthService.registerTeacher(email, password, name, school);

      if (isSuccess) {
        Alert.alert("가입 성공", "회원가입이 완료되었습니다!\n로그인 해주세요.", [
          { text: "확인", onPress: () => router.replace('/screens/Teacher_Login') }
        ]);
      } else {
        Alert.alert("가입 실패", "이미 가입된 이메일이거나 서버 오류입니다.");
      }
    } catch (error) {
      console.error("회원가입 에러:", error);
      Alert.alert("오류", "서버와 통신 중 오류가 발생했습니다.");
    } finally {
      // 4. 로딩 종료
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          <View style={[styles.cardContainer, { width: cardWidth, height: cardHeight }]}>
            
            {/* 배경 이미지 */}
            <Image
              source={require('../../../assets/login_background.png')} 
              style={styles.backgroundImage}
              resizeMode="stretch"
            />

            <View style={[
              styles.contentWrapper, 
              { 
                paddingHorizontal: paddingH, 
                paddingTop: paddingV * 0.4, 
                paddingBottom: paddingV * 1.6 
              }
            ]}>
              
              <Text style={[styles.titleText, { fontSize: titleSize, marginBottom: spacing }]}>
                교사 회원가입
              </Text>

              <View style={{ width: '100%', gap: spacing }}>
                {/* 💡 InputBox 컴포넌트에 icon, placeholder, value 등을 전달 */}
                <InputBox icon="person" placeholder="이름" value={name} onChange={setName} height={inputHeight} fontSize={fontSizeInput} color="#D4E4F7" />
                <InputBox icon="mail" placeholder="이메일" value={email} onChange={setEmail} height={inputHeight} fontSize={fontSizeInput} color="#F4D4D4" />
                <InputBox icon="lock-closed" placeholder="비밀번호" value={password} onChange={setPassword} isPassword height={inputHeight} fontSize={fontSizeInput} color="#D4E4F7" />
                <InputBox icon="checkmark-circle" placeholder="비밀번호 확인" value={passwordConfirm} onChange={setPasswordConfirm} isPassword height={inputHeight} fontSize={fontSizeInput} color="#F4D4D4" />
                <InputBox icon="school" placeholder="소속 학교" value={school} onChange={setSchool} height={inputHeight} fontSize={fontSizeInput} color="#D4E4F7" />
              </View>

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setAgreed(!agreed)}
                style={[styles.checkboxContainer, { marginTop: spacing, marginBottom: spacing }]}
              >
                <Ionicons name={agreed ? "checkbox" : "square-outline"} size={22} color={agreed ? "#7CB3F5" : "#A0AEC0"} />
                <Text style={[styles.checkboxText, { fontSize: fontSizeInput * 0.9 }]}>이용약관 동의</Text>
              </TouchableOpacity>

              {/* 가입하기 버튼 (로딩 상태 적용) */}
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleSignup}
                disabled={loading} // 로딩 중 클릭 방지
                style={[
                  styles.mainButton, 
                  { 
                    height: inputHeight, 
                    marginBottom: spacing, 
                    backgroundColor: CONFIG.colors.btnBackground, 
                    borderColor: CONFIG.colors.btnBorder,
                    opacity: loading ? 0.7 : 1 
                  }
                ]}
              >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: fontSizeInput * 1.2 }}>가입하기</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: spacing }}>
                <Text style={[styles.linkText, { fontSize: fontSizeInput * 0.8 }]}>뒤로가기</Text>
              </TouchableOpacity>

              <View style={styles.socialContainer}>
                
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={handleKakaoSignup} 
                  style={[styles.socialButton, { height: inputHeight, backgroundColor: '#FEE500' }]}
                >
                  <Ionicons name="chatbubble-sharp" size={fontSizeInput * 1.2} color="#371D1E" />
                  <Text style={[styles.socialText, { fontSize: fontSizeInput, color: '#371D1E' }]}>카카오톡</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={handleNaverSignup} 
                  style={[styles.socialButton, { height: inputHeight, backgroundColor: '#03C75A' }]}
                >
                  <Text style={[styles.socialText, { fontSize: fontSizeInput * 1.2, color: 'white' }]}>N</Text>
                  <Text style={[styles.socialText, { fontSize: fontSizeInput, color: 'white' }]}>네이버</Text>
                </TouchableOpacity>

              </View>
            </View>

            {/* 로봇 이미지 */}
            <View 
              pointerEvents="none" 
              style={{ 
                position: 'absolute', 
                zIndex: 20, 
                width: robotSize, 
                height: robotSize, 
                top: cardHeight * 0.08, 
                left: -cardWidth * 0.18, 
                transform: [{ rotate: '-15deg' }] 
              }}
            >
              <Image
                source={require('../../../assets/common_TeacherSignUp.png')}
                style={styles.fullImage}
                resizeMode="contain"
              />
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

//  InputBox 컴포넌트 (props 타입 적용)
const InputBox = ({ icon, placeholder, value, onChange, isPassword, height, fontSize, color }: InputBoxProps) => (
  <View style={[styles.inputContainer, { height, borderColor: color }]}>
    <Ionicons name={icon} size={fontSize * 1.3} color={color === '#F4D4D4' ? '#C68D8D' : '#8DA6C6'} />
    <TextInput
      style={[styles.textInput, { fontSize }]}
      placeholder={placeholder}
      placeholderTextColor="#A0B4CC"
      value={value}
      onChangeText={onChange}
      secureTextEntry={isPassword}
      autoCapitalize="none"
    />
  </View>
);

//  스타일 정의 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    width: '130%',
    height: '95%', 
    top: 0,
    left: -75,   
  },
  contentWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  titleText: {
    color: CONFIG.colors.textTitle,
    fontWeight: '900',
    textShadowColor: '#5C7CFA',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxText: {
    marginLeft: 8,
    color: '#718096',
    fontWeight: 'bold',
  },
  mainButton: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    borderBottomWidth: 4,
  },
  linkText: {
    color: '#A0AEC0',
    textDecorationLine: 'underline',
  },
  socialContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    gap: 6,
  },
  socialText: {
    fontWeight: 'bold',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  // InputBox 스타일
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 3,
    borderRadius: 999,
    paddingHorizontal: 14,
    width: '100%',
  },
  textInput: {
    flex: 1,
    marginLeft: 8,
    color: '#4A5568',
    fontWeight: '600',
  },
});