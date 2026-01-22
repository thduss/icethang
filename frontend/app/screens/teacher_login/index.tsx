import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { login } from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';
import { loginAPI } from '../../api/auth';

const CONFIG = {
  colors: {
    textTitle: '#2D3748', 
    textOutline: '#FFFFFF',
    inputBorder: '#D4E4F7',
    inputBorderPw: '#F4D4D4',
    btnBackground: '#8CB6F0',
    btnBorder: '#6A94D0',
  },
};

export default function TeacherLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // 📐 [크기 설정: 다시 시원시원하게 키움!]
  // 1. 너비: 화면의 60% -> 75%로 확대
  // 2. 최대 크기: 450px -> 580px로 확대
  const cardWidth = Math.min(screenWidth * 0.75, 580); 
  
  // 높이: 세로로 긴 비율 유지 (약간 더 길게)
  const cardHeight = cardWidth * 1.1; 

  // 📏 [내용물 크기: 다시 두툼하게]
  const inputHeight = Math.min(cardHeight * 0.12, 54); // 48 -> 54
  const buttonHeight = Math.min(cardHeight * 0.12, 54);
  
  const titleSize = Math.min(cardWidth * 0.09, 36); // 글자 크기 확대
  const fontSizeInput = Math.min(cardWidth * 0.045, 17);
  const robotSize = Math.min(cardWidth * 0.5, 230); // 로봇도 확대

  // 🎨 [여백 조정]
  const spacing = Math.min(cardHeight * 0.035, 18); 
  const paddingH = cardWidth * 0.16; 
  const paddingV = cardHeight * 0.13; 

  // ⚡️ [초기화] 네이버 로그인 설정
  useEffect(() => {
    NaverLogin.initialize({
      appName: 'IceTag',
      consumerKey: '여기에_Client_ID_붙여넣기',    
      consumerSecret: '여기에_Client_Secret_붙여넣기', 
      serviceUrlSchemeIOS: 'icetag',
      disableNaverAppAuthIOS: true,
    });
  }, []);

  // 🟡 [기능 1] 카카오 로그인
  const handleKakaoLogin = async () => {
    try {
      const token = await login();
      console.log('카카오 토큰:', token);
      Alert.alert("성공", "카카오 로그인이 완료되었습니다!");
      router.replace('/screens/Teacher_MainPage/TeacherMainPage');
    } catch (err) {
      console.error("카카오 로그인 에러:", err);
      Alert.alert("실패", "카카오 로그인 중 오류가 발생했습니다.");
    }
  };

  // 🟢 [기능 2] 네이버 로그인
  const handleNaverLogin = async () => {
    try {
      const { successResponse, failureResponse } = await NaverLogin.login();
      if (successResponse) {
        console.log("네이버 토큰:", successResponse.accessToken);
        Alert.alert("성공", "네이버 로그인 성공!");
        router.replace('/screens/Teacher_MainPage/TeacherMainPage');
      } else {
        console.log("네이버 로그인 실패", failureResponse);
      }
    } catch (err) {
      console.error("네이버 로그인 에러:", err);
    }
  };

  // 🔵 [기능 3] 이메일 로그인
  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("알림", "이메일과 비밀번호를 입력해주세요.");
      return;
    }
    try {
      const isSuccess = await loginAPI(email, password);
      if (isSuccess) {
        Alert.alert("환영합니다!", "로그인에 성공했습니다.");
        router.replace('/screens/Teacher_MainPage/TeacherMainPage');
      } else {
        Alert.alert("실패", "아이디 또는 비밀번호를 확인해주세요.");
      }
    } catch (error) {
      Alert.alert("에러", "서버 연결에 실패했습니다.");
    }
  };

  // // 🔵 [테스트용] 무조건 로그인 성공시키기
  // const handleEmailLogin = async () => {
  //   // 1. 입력창 비었는지 체크 (이건 유지)
  //   if (!email || !password) {
  //     Alert.alert("알림", "이메일과 비밀번호를 입력해주세요.");
  //     return;
  //   }

  //   // 2. 백엔드 무시하고 무조건 성공 처리 (테스트 끝나면 나중에 지우세요!)
  //   console.log("강제 로그인 성공!");
  //   Alert.alert("환영합니다!", "테스트 로그인 성공");
  //   router.replace('/screens/Teacher_MainPage/TeacherMainPage'); 
  // };

  return (
    <View style={{ flex: 1, backgroundColor: '#FDFCF6' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ☁️ 로그인 카드 */}
          <View style={{ width: cardWidth, height: cardHeight, justifyContent: 'center', alignItems: 'center' }}>
            
            {/* 구름 배경 */}
            <Image
              source={require('../../../assets/login_background.png')} 
              style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}
              resizeMode="stretch"
            />

            {/* 내용물 컨테이너 */}
            <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: paddingH, paddingVertical: paddingV, zIndex: 10 }}>
              
              <View style={{ marginBottom: spacing * 1.5 }}>
                <Text style={{ fontSize: titleSize, color: CONFIG.colors.textTitle, fontWeight: '900', textAlign: 'center', textShadowColor: 'white', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 }}>
                  교사 로그인
                </Text>
              </View>

              {/* 이메일 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 3.5, borderRadius: 999, paddingHorizontal: 16, borderColor: CONFIG.colors.inputBorder, height: inputHeight, marginBottom: spacing, width: '100%' }}>
                <Ionicons name="mail-outline" size={fontSizeInput * 1.3} color="#8DA6C6" />
                <TextInput
                  style={{ flex: 1, marginLeft: 10, fontSize: fontSizeInput, color: '#4A5568', paddingTop: 0, fontWeight: '600' }}
                  placeholder="이메일"
                  placeholderTextColor="#A0B4CC"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* 비밀번호 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 3.5, borderRadius: 999, paddingHorizontal: 16, borderColor: CONFIG.colors.inputBorderPw, height: inputHeight, marginBottom: spacing * 1.2, width: '100%' }}>
                <Ionicons name="lock-closed-outline" size={fontSizeInput * 1.3} color="#C68D8D" />
                <TextInput
                  style={{ flex: 1, marginLeft: 10, fontSize: fontSizeInput, color: '#4A5568', paddingTop: 0, fontWeight: '600' }}
                  placeholder="비밀번호"
                  placeholderTextColor="#CCA0A0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                />
                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                  <Ionicons name={isPasswordVisible ? "eye-outline" : "eye-off-outline"} size={fontSizeInput * 1.3} color="#C68D8D" />
                </TouchableOpacity>
              </View>

              {/* 로그인 버튼 */}
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleEmailLogin}
                style={{ width: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 999, borderBottomWidth: 3.5, backgroundColor: CONFIG.colors.btnBackground, borderColor: CONFIG.colors.btnBorder, height: buttonHeight, marginBottom: spacing }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: titleSize * 0.6 }}>로그인</Text>
              </TouchableOpacity>

              {/* 소셜 버튼 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: spacing * 0.5, paddingHorizontal: 5 }}>
                <View style={{ flex: 1, height: 2, backgroundColor: '#E2E8F0' }} />
                <Text style={{ marginHorizontal: 8, color: '#A0AEC0', fontWeight: 'bold', fontSize: fontSizeInput * 0.75 }}>또는 소셜 로그인</Text>
                <View style={{ flex: 1, height: 2, backgroundColor: '#E2E8F0' }} />
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: spacing * 0.2 }}>
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={handleKakaoLogin}
                  style={{ justifyContent: 'center', alignItems: 'center', width: Math.min(cardWidth * 0.2, 80), height: buttonHeight * 0.8, borderRadius: 15, backgroundColor: '#FEE500' }}
                >
                  <Ionicons name="chatbubble-sharp" size={fontSizeInput} color="#371D1E" />
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={handleNaverLogin}
                  style={{ justifyContent: 'center', alignItems: 'center', width: Math.min(cardWidth * 0.2, 80), height: buttonHeight * 0.8, borderRadius: 15, backgroundColor: '#03C75A' }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: fontSizeInput }}>N</Text>
                </TouchableOpacity>
              </View>

              {/* 회원가입 버튼 */}
              <TouchableOpacity 
                style={{ marginTop: 5 }}
                onPress={() => router.push('/screens/signup')} 
              >
                <Text style={{ color: '#718096', textDecorationLine: 'underline', fontWeight: 'bold', fontSize: fontSizeInput * 0.75 }}>
                  회원가입
                </Text>
              </TouchableOpacity>

            </View> 

            {/* 🤖 로봇 */}
            <View 
              pointerEvents="none" 
              style={{ 
                position: 'absolute', 
                zIndex: 20, 
                width: robotSize, 
                height: robotSize, 
                bottom: -cardHeight * 0.05, 
                left: -cardWidth * 0.18, 
                transform: [{ rotate: '-10deg' }] 
              }}
            >
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png' }} 
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}