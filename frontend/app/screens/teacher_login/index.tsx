import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { login } from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';

const CONFIG = {
  colors: {
    textTitle: '#E3F2FD', 
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
  
  const { width: screenWidth } = useWindowDimensions();

  // 📐 크기 설정 (선생님 화면 비율 1.1 유지)
  const cardWidth = Math.min(screenWidth * 0.75, 580); 
  const cardHeight = cardWidth * 1.1; 

  const inputHeight = Math.min(cardHeight * 0.12, 54); 
  const buttonHeight = Math.min(cardHeight * 0.12, 54);
  
  // 폰트 및 로봇 크기 설정
  const titleSize = Math.min(cardWidth * 0.11, 42); 
  const fontSizeInput = Math.min(cardWidth * 0.045, 17);
  const robotSize = Math.min(cardWidth * 0.5, 230); 

  const spacing = Math.min(cardHeight * 0.035, 18); 
  const paddingH = cardWidth * 0.16; 
  const paddingV = cardHeight * 0.13; 

  // ⚡️ 네이버 로그인 초기화
  useEffect(() => {
    NaverLogin.initialize({
      appName: 'IceTag',
      consumerKey: '여기에_Client_ID_붙여넣기',    
      consumerSecret: '여기에_Client_Secret_붙여넣기', 
      serviceUrlSchemeIOS: 'icetag',
      disableNaverAppAuthIOS: true,
    });
  }, []);

  // 🟡 카카오 로그인
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

  // 🟢 네이버 로그인
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

  // 🔵 이메일 로그인
  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("알림", "이메일과 비밀번호를 입력해주세요.");
      return;
    }
 
 
    // API 연결 시 아래 주석 해제 및 사용
    /*
    try {
      const isSuccess = await loginAPI(email, password);
      if (isSuccess) {
        router.replace('/screens/Teacher_MainPage/TeacherMainPage');
      } else {
        Alert.alert("실패", "아이디 또는 비밀번호를 확인해주세요.");
      }
    } catch (error) {
      Alert.alert("에러", "서버 연결에 실패했습니다.");
    }
    */
 
    // 테스트용 강제 이동
    router.replace('/screens/Teacher_MainPage/TeacherMainPage');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFDF5' }}>
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
              
              {/* 타이틀 */}
              <View style={{ marginBottom: spacing * 1.5 }}>
                <Text style={{ 
                  fontSize: titleSize, 
                  color: '#E3F2FD', 
                  fontWeight: '900', 
                  textAlign: 'center', 
                  textShadowColor: '#5C7CFA', 
                  textShadowOffset: { width: 2, height: 2 }, 
                  textShadowRadius: 1 
                }}>
                  교사 로그인
                </Text>
              </View>

              {/* 이메일 입력창 */}
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

              {/* 비밀번호 입력창 */}
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
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: titleSize * 0.55 }}>로그인</Text>
              </TouchableOpacity>

              {/* 소셜 버튼 구분선 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: spacing * 0.5, paddingHorizontal: 5 }}>
                <View style={{ flex: 1, height: 2, backgroundColor: '#E2E8F0' }} />
                <Text style={{ marginHorizontal: 8, color: '#A0AEC0', fontWeight: 'bold', fontSize: fontSizeInput * 0.75 }}>또는 소셜 로그인</Text>
                <View style={{ flex: 1, height: 2, backgroundColor: '#E2E8F0' }} />
              </View>

              {/* 소셜 로그인 버튼들 */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: spacing * 0.2 }}>
                
                {/* 카카오 */}
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={handleKakaoLogin}
                  style={{ justifyContent: 'center', alignItems: 'center', width: Math.min(cardWidth * 0.2, 80), height: buttonHeight * 0.8, borderRadius: 15, backgroundColor: '#FEE500' }}
                >
                   <Ionicons name="chatbubble-sharp" size={fontSizeInput * 1.4} color="#371D1E" />
                   <Text style={{ position: 'absolute', color: '#FEE500', fontWeight: '900', fontSize: fontSizeInput * 0.7, marginTop: -2 }}>K</Text>
                </TouchableOpacity>

                {/* 네이버 */}
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={handleNaverLogin}
                  style={{ justifyContent: 'center', alignItems: 'center', width: Math.min(cardWidth * 0.2, 80), height: buttonHeight * 0.8, borderRadius: 15, backgroundColor: '#03C75A' }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: fontSizeInput * 1.2 }}>N</Text>
                </TouchableOpacity>
              </View>

              {/* 회원가입 버튼 */}
              <TouchableOpacity 
                style={{ marginTop: 5 }}
                onPress={() => router.push('/screens/signup')} 
              >
                <Text style={{ color: '#718096', textDecorationLine: 'underline', fontWeight: 'bold', fontSize: fontSizeInput * 1.0 }}>
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
                source={require('../../../assets/robot.png')}
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
