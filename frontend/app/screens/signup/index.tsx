import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 👇 [추가] 소셜 로그인 라이브러리 가져오기
import { login } from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';

// 🎨 디자인 설정
const CONFIG = {
  colors: {
    textTitle: '#6B7280', 
    inputBorder: '#E2E8F0',
    inputBg: '#F8FAFC',
    btnBackground: '#8CB6F0', 
    btnBorder: '#6A94D0',
  },
};

export default function SignupScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [school, setSchool] = useState('');
  const [agreed, setAgreed] = useState(false);

  // 📐 [크기 설정]
  const cardWidth = Math.min(screenWidth * 0.75, 600); 
  const cardHeight = cardWidth * 1.2; 
  const inputHeight = Math.min(cardHeight * 0.075, 48); 
  const fontSizeInput = Math.min(cardWidth * 0.04, 16);
  const titleSize = Math.min(cardWidth * 0.08, 32);
  const robotSize = Math.min(cardWidth * 0.35, 160); 
  const spacing = Math.min(cardHeight * 0.02, 10); 
  const paddingH = cardWidth * 0.16; 
  const paddingV = cardHeight * 0.08; 

  // ⚡️ [추가] 네이버 초기화 (로그인 화면과 동일하게 키 입력 필요!)
  useEffect(() => {
    NaverLogin.initialize({
      appName: 'IceTag',
      consumerKey: '여기에_Client_ID_붙여넣기',     // 👈 백엔드에서 받은 키
      consumerSecret: '여기에_Client_Secret_붙여넣기', // 👈 백엔드에서 받은 키
      serviceUrlSchemeIOS: 'icetag',
      disableNaverAppAuthIOS: true,
    });
  }, []);

  // 🟡 [기능 1] 카카오로 가입하기
  const handleKakaoSignup = async () => {
    try {
      const token = await login();
      console.log('카카오 가입 토큰:', token);
      
      // 가입 성공 시 알림 -> 로그인 화면으로 이동
      Alert.alert("성공", "카카오 계정으로 가입되었습니다!\n로그인 해주세요.", [
        { text: "확인", onPress: () => router.replace('/screens/teacher_login') }
      ]);
    } catch (err) {
      console.error("카카오 가입 에러:", err);
      Alert.alert("실패", "카카오 가입 중 오류가 발생했습니다.");
    }
  };

  // 🟢 [기능 2] 네이버로 가입하기
  const handleNaverSignup = async () => {
    try {
      const { successResponse, failureResponse } = await NaverLogin.login();
      if (successResponse) {
        console.log("네이버 가입 토큰:", successResponse.accessToken);
        
        // 가입 성공 시 알림 -> 로그인 화면으로 이동
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

  // 🔵 [기능 3] 일반 이메일 가입하기
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
    <View style={{ flex: 1, backgroundColor: '#FDFCF6' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: cardWidth, height: cardHeight, justifyContent: 'center', alignItems: 'center' }}>
            
            <Image
              source={require('../../../assets/login_background.png')} 
              style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}
              resizeMode="stretch"
            />

            <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: paddingH, paddingVertical: paddingV, zIndex: 10 }}>
              
              <Text style={{ fontSize: titleSize, color: '#7CB3F5', fontWeight: '900', marginBottom: spacing * 1.5, textShadowColor: 'white', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 }}>
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
                <Ionicons name={agreed ? "checkbox" : "square-outline"} size={20} color={agreed ? "#7CB3F5" : "#A0AEC0"} />
                <Text style={{ marginLeft: 8, color: '#718096', fontWeight: 'bold', fontSize: fontSizeInput * 0.8 }}>이용약관 동의</Text>
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

              {/* 🏷️ 소셜 가입 버튼 (기능 연결됨) */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing * 0.2 }}>
                <SocialButton 
                  text="카카오톡으로 가입" 
                  color="#FEE500" 
                  icon="K" 
                  textColor="#371D1E" 
                  fontSize={fontSizeInput * 0.8} 
                  onPress={handleKakaoSignup} // 👈 연결!
                />
                <SocialButton 
                  text="네이버로 가입" 
                  color="#03C75A" 
                  icon="N" 
                  fontSize={fontSizeInput * 0.8} 
                  onPress={handleNaverSignup} // 👈 연결!
                />
              </View>

            </View>

            <View 
              pointerEvents="none" 
              style={{ 
                position: 'absolute', 
                zIndex: 20, 
                width: robotSize, 
                height: robotSize, 
                top: -cardHeight * 0.02, 
                left: -cardWidth * 0.12, 
                transform: [{ rotate: '-15deg' }] 
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

// 📦 [부품 1] 입력창 컴포넌트
const InputBox = ({ icon, placeholder, value, onChange, isPassword, height, fontSize, color }: any) => (
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

// 📦 [부품 2] 소셜 버튼 컴포넌트 (onPress 추가됨!)
const SocialButton = ({ text, color, icon, textColor = 'white', fontSize, onPress }: any) => (
  <TouchableOpacity 
    onPress={onPress} // 👈 클릭 기능 활성화
    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: color, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
  >
    <Text style={{ fontWeight: '900', color: textColor, marginRight: 6, fontSize: fontSize }}>{icon}</Text>
    <Text style={{ fontWeight: 'bold', color: textColor, fontSize: fontSize }}>{text}</Text>
  </TouchableOpacity>
);