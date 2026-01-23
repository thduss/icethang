import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { login } from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';

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

  // 📐 [크기 설정]
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
    NaverLogin.initialize({
      appName: 'IceTag',
      consumerKey: '여기에_Client_ID_붙여넣기',     
      consumerSecret: '여기에_Client_Secret_붙여넣기', 
      serviceUrlSchemeIOS: 'icetag',
      disableNaverAppAuthIOS: true,
    });
  }, []);

  const handleKakaoSignup = async () => {
    try {
      const token = await login();
      console.log('카카오 가입 토큰:', token);
      Alert.alert("성공", "카카오 계정으로 가입되었습니다!\n로그인 해주세요.", [
        { text: "확인", onPress: () => router.replace('/screens/teacher_login') }
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
          { text: "확인", onPress: () => router.replace('/screens/teacher_login') }
        ]);
      } else {
        console.log("네이버 가입 실패", failureResponse);
      }
    } catch (err) {
      console.error("네이버 가입 에러:", err);
    }
  };

  const handleSignup = () => {
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
    Alert.alert("성공", "회원가입이 완료되었습니다!\n로그인 해주세요.", [
      { text: "확인", onPress: () => router.replace('/screens/teacher_login') }
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFDF5' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          <View style={{ width: cardWidth, height: cardHeight, justifyContent: 'center', alignItems: 'center' }}>
            
            <Image
              source={require('../../../assets/login_background.png')} 
              style={{ position: 'absolute', width: '130%', height: '95%', top: 0, left: -75 }}
              resizeMode="stretch"
            />

            <View style={{ 
              width: '100%', 
              height: '100%', 
              alignItems: 'center', 
              justifyContent: 'center', 
              paddingHorizontal: paddingH, 
              // 👇 [수정됨] 상단 여백을 줄여서(0.4) 내용물을 위로 올림
              paddingTop: paddingV * 0.4, 
              paddingBottom: paddingV * 1.6, 
              zIndex: 10 
            }}>
              
              <Text style={{ fontSize: titleSize, color: CONFIG.colors.textTitle, fontWeight: '900', marginBottom: spacing, textShadowColor: '#5C7CFA', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 1 }}>
                교사 회원가입
              </Text>

              <View style={{ width: '100%', gap: spacing }}>
                <InputBox icon="person" placeholder="이름" value={name} onChange={setName} height={inputHeight} fontSize={fontSizeInput} color="#D4E4F7" />
                <InputBox icon="mail" placeholder="이메일" value={email} onChange={setEmail} height={inputHeight} fontSize={fontSizeInput} color="#F4D4D4" />
                <InputBox icon="lock-closed" placeholder="비밀번호" value={password} onChange={setPassword} isPassword height={inputHeight} fontSize={fontSizeInput} color="#D4E4F7" />
                <InputBox icon="checkmark-circle" placeholder="비밀번호 확인" value={passwordConfirm} onChange={setPasswordConfirm} isPassword height={inputHeight} fontSize={fontSizeInput} color="#F4D4D4" />
                <InputBox icon="school" placeholder="소속 학교" value={school} onChange={setSchool} height={inputHeight} fontSize={fontSizeInput} color="#D4E4F7" />
              </View>

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setAgreed(!agreed)}
                style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing, marginBottom: spacing }}
              >
                <Ionicons name={agreed ? "checkbox" : "square-outline"} size={22} color={agreed ? "#7CB3F5" : "#A0AEC0"} />
                <Text style={{ marginLeft: 8, color: '#718096', fontWeight: 'bold', fontSize: fontSizeInput * 0.9 }}>이용약관 동의</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleSignup}
                style={{ width: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 999, backgroundColor: CONFIG.colors.btnBackground, height: inputHeight, borderBottomWidth: 4, borderColor: CONFIG.colors.btnBorder, marginBottom: spacing }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: fontSizeInput * 1.2 }}>가입하기</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: spacing }}>
                <Text style={{ color: '#A0AEC0', textDecorationLine: 'underline', fontSize: fontSizeInput * 0.8 }}>뒤로가기</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', width: '100%', gap: 10 }}>
                
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={handleKakaoSignup} 
                  style={{ 
                    flex: 1, 
                    flexDirection: 'row',
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: inputHeight,
                    borderRadius: 15, 
                    backgroundColor: '#FEE500', 
                    gap: 6
                  }}
                >
                  <Ionicons name="chatbubble-sharp" size={fontSizeInput * 1.2} color="#371D1E" />
                  <Text style={{ color: '#371D1E', fontWeight: 'bold', fontSize: fontSizeInput }}>
                    카카오톡
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={handleNaverSignup} 
                  style={{ 
                    flex: 1, 
                    flexDirection: 'row',
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: inputHeight, 
                    borderRadius: 15, 
                    backgroundColor: '#03C75A', 
                    gap: 6
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: fontSizeInput * 1.2 }}>N</Text>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: fontSizeInput }}>
                    네이버
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 🤖 로봇 */}
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

const InputBox = ({ icon, placeholder, value, onChange, isPassword, height, fontSize, color }: InputBoxProps) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 3, borderRadius: 999, paddingHorizontal: 14, borderColor: color, height: height, width: '100%' }}>
    <Ionicons name={icon} size={fontSize * 1.3} color={color === '#F4D4D4' ? '#C68D8D' : '#8DA6C6'} />
    <TextInput
      style={{ flex: 1, marginLeft: 8, fontSize: fontSize, color: '#4A5568', fontWeight: '600' }}
      placeholder={placeholder}
      placeholderTextColor="#A0B4CC"
      value={value}
      onChangeText={onChange}
      secureTextEntry={isPassword}
      autoCapitalize="none"
    />
  </View>
);