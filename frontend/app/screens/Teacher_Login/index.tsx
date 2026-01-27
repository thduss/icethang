import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { initNaverLogin } from '../../utils/naverConfig';

import { login } from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';

import { AuthService } from '../../services/auth'; 

const CONFIG = {
  colors: {
    textTitle: '#E3F2FD', 
    inputBorder: '#D4E4F7',
    inputBorderPw: '#F4D4D4',
    btnBackground: '#8CB6F0',
    btnBorder: '#6A94D0',
    textPlaceholder: '#A0B4CC',
    textInput: '#4A5568',
  },
};

export default function TeacherLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  //  로딩 상태 추가 (서버 응답 대기 중일 때 버튼 비활성화)
  const [loading, setLoading] = useState(false);
  
  const { width: screenWidth } = useWindowDimensions();

  // 크기 설정 
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

  // 네이버 로그인 초기화
  useEffect(() => {
      initNaverLogin();
    }, []);

  // 카카오 로그인
  const handleKakaoLogin = async () => {
    try {
      const token = await login();
      console.log('카카오 토큰:', token);
      Alert.alert("성공", "카카오 로그인이 완료되었습니다!");
      router.replace('/screens/Teacher_MainPage');
    } catch (err) {
      console.error("카카오 로그인 에러:", err);
      Alert.alert("실패", "카카오 로그인 중 오류가 발생했습니다.");
    }
  };

  // 네이버 로그인
  const handleNaverLogin = async () => {
    try {
      const { successResponse, failureResponse } = await NaverLogin.login();
      if (successResponse) {
        console.log("네이버 토큰:", successResponse.accessToken);
        Alert.alert("성공", "네이버 로그인 성공!");
        router.replace('/screens/Teacher_MainPage');
      } else {
        console.log("네이버 로그인 실패", failureResponse);
      }
    } catch (err) {
      console.error("네이버 로그인 에러:", err);
    }
  };

  const handleEmailLogin = async () => {
    // 1. 유효성 검사
    if (!email || !password) {
      Alert.alert("알림", "이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    // 2. 로딩 시작 (버튼 뱅글뱅글)
    setLoading(true);

    try {
      // 3. AuthService를 통해 스프링 부트 서버로 요청 전송
      const result = await AuthService.teacherLogin(email, password);

      // 4. 결과 처리
      if (result.success) {
        console.log("로그인 성공!");
        router.replace('/screens/Teacher_MainPage');
      } else {
        Alert.alert("로그인 실패", result.msg || "아이디 또는 비밀번호를 확인해주세요.");
      }
    } catch (error) {
      console.error("로그인 중 시스템 에러:", error);
      Alert.alert("오류", "시스템 오류가 발생했습니다.");
    } finally {
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
        >
          {/* 로그인 카드 */}
          <View style={[styles.cardContainer, { width: cardWidth, height: cardHeight }]}>
            
            {/* 구름 배경 */}
            <Image
              source={require('../../../assets/login_background.png')} 
              style={styles.backgroundImage}
              resizeMode="stretch"
            />

            {/* 내용물 컨테이너 */}
            <View style={[
              styles.contentWrapper, 
              { paddingHorizontal: paddingH, paddingVertical: paddingV }
            ]}>
              
              {/* 타이틀 */}
              <View style={{ marginBottom: spacing * 1.5 }}>
                <Text style={[styles.titleText, { fontSize: titleSize }]}>
                  교사 로그인
                </Text>
              </View>

              {/* 이메일 입력창 */}
              <View style={[
                styles.inputContainer, 
                { height: inputHeight, marginBottom: spacing, borderColor: CONFIG.colors.inputBorder }
              ]}>
                <Ionicons name="mail-outline" size={fontSizeInput * 1.3} color="#8DA6C6" />
                <TextInput
                  style={[styles.textInput, { fontSize: fontSizeInput }]}
                  placeholder="이메일"
                  placeholderTextColor={CONFIG.colors.textPlaceholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* 비밀번호 입력창 */}
              <View style={[
                styles.inputContainer, 
                { height: inputHeight, marginBottom: spacing * 1.2, borderColor: CONFIG.colors.inputBorderPw }
              ]}>
                <Ionicons name="lock-closed-outline" size={fontSizeInput * 1.3} color="#C68D8D" />
                <TextInput
                  style={[styles.textInput, { fontSize: fontSizeInput }]}
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

              {/* 로그인 버튼 (로딩 상태 적용) */}
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleEmailLogin}
                disabled={loading} 
                style={[
                  styles.loginButton, 
                  { 
                    height: buttonHeight, 
                    marginBottom: spacing,
                    opacity: loading ? 0.7 : 1 
                  }
                ]}
              >
                {loading ? (
                  // 로딩 중이면 뺑글이 표시
                  <ActivityIndicator color="white" />
                ) : (
                  // 평소에는 텍스트 표시
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: titleSize * 0.55 }}>로그인</Text>
                )}
              </TouchableOpacity>

              {/* 소셜 버튼 구분선 */}
              <View style={[styles.dividerContainer, { marginBottom: spacing * 0.5 }]}>
                <View style={styles.dividerLine} />
                <Text style={[styles.dividerText, { fontSize: fontSizeInput * 0.75 }]}>또는 소셜 로그인</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* 소셜 로그인 버튼들 */}
              <View style={[styles.socialContainer, { marginBottom: spacing * 0.2 }]}>
                
                {/* 카카오 */}
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={handleKakaoLogin}
                  style={[
                    styles.socialButton, 
                    { 
                      width: Math.min(cardWidth * 0.2, 80), 
                      height: buttonHeight * 0.8, 
                      backgroundColor: '#FEE500' 
                    }
                  ]}
                >
                    <Ionicons name="chatbubble-sharp" size={fontSizeInput * 1.4} color="#371D1E" />
                </TouchableOpacity>

                {/* 네이버 */}
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={handleNaverLogin}
                  style={[
                    styles.socialButton, 
                    { 
                      width: Math.min(cardWidth * 0.2, 80), 
                      height: buttonHeight * 0.8, 
                      backgroundColor: '#03C75A' 
                    }
                  ]}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: fontSizeInput * 1.2 }}>N</Text>
                </TouchableOpacity>
              </View>

              {/* 회원가입 버튼 */}
              <TouchableOpacity 
                style={{ marginTop: 5 }}
                onPress={() => router.push('/screens/Signup')} 
              >
                <Text style={{ color: '#718096', textDecorationLine: 'underline', fontWeight: 'bold', fontSize: fontSizeInput * 1.0 }}>
                  회원가입
                </Text>
              </TouchableOpacity>

            </View> 

            {/* 로봇 */}
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
                source={require('../../../assets/common_TeacherLogin.png')}
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

// 스타일 정의 (StyleSheet)
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
    paddingVertical: 40,
  },
  cardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  contentWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  titleText: {
    color: '#AEC7EC',
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 3.5,
    borderRadius: 999,
    paddingHorizontal: 16,
    width: '100%',
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    color: CONFIG.colors.textInput,
    paddingTop: 0,
    fontWeight: '600',
  },
  loginButton: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    borderBottomWidth: 3.5,
    backgroundColor: CONFIG.colors.btnBackground,
    borderColor: CONFIG.colors.btnBorder,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 5,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 8,
    color: '#A0AEC0',
    fontWeight: 'bold',
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});