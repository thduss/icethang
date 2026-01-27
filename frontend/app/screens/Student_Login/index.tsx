import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthService } from '../../services/auth';

export default function StudentLoginScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  // 입력 상태 관리
  // (주의: 디자인상 '반'을 입력받지만 변수명이 grade로 되어 있어 헷갈릴 수 있습니다.
  //  API 전송 시에는 이 값을 classNum으로 보냅니다.)
  const [classNumInput, setClassNumInput] = useState(''); // 변수명 명확하게 수정 (기존 grade)
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [authCode, setAuthCode] = useState('');

  // 로딩 상태
  const [loading, setLoading] = useState(false);

  // [크기 설정]
  const cardWidth = Math.min(screenWidth * 0.75, 580); 
  const cardHeight = cardWidth * 1.1; 

  const inputHeight = Math.min(cardHeight * 0.12, 54); 
  const buttonHeight = Math.min(cardHeight * 0.12, 54);
  const fontSizeInput = Math.min(cardWidth * 0.045, 17);
  const titleSize = Math.min(cardWidth * 0.15, 54);
  const robotSize = Math.min(cardWidth * 0.5, 230); 

  const spacing = Math.min(cardHeight * 0.025, 15); 
  const paddingH = cardWidth * 0.14; 
  const paddingV = cardHeight * 0.12; 

  // 실제 서버 로그인 함수
  const handleEnter = async () => {
    // 1. 빈칸 체크
    if (!classNumInput || !number || !name || !authCode) {
      Alert.alert("알림", "모든 정보를 입력해주세요.");
      return;
    }

    // 2. 로딩 시작
    setLoading(true);

    try {
      // 3. 서버로 데이터 전송
      // AuthService.studentLogin(학년, 반, 번호, 이름, 인증코드)
      //  현재 UI에 '학년' 입력창이 없으므로, 일단 "1"(1학년)로 고정해서 보냅니다.
      const fixedGrade = "1"; 
      
      const result = await AuthService.studentLogin(
        fixedGrade,   // 학년 (API의 grade)
        classNumInput,// 반 (API의 classNum)
        number,       // 번호 (API의 studentNumber)
        name,         // 이름
        authCode      // 인증코드
      );

      // 4. 결과 처리
      if (result.success) {
        Alert.alert("환영합니다!", `${name} 학생 입장!`, [
          { text: "확인", onPress: () => router.replace('/screens/student_home') }
        ]);
      } else {
        // 실패 시 (인증코드 틀림 등)
        Alert.alert("입장 실패", result.msg || "정보를 다시 확인해주세요.", [
          { 
            text: "다시 입력", 
            onPress: () => setAuthCode('') // 인증코드 초기화
          }
        ]);
      }
    } catch (error) {
      console.error("학생 로그인 에러:", error);
      Alert.alert("오류", "서버와 연결할 수 없습니다.");
    } finally {
      // 5. 로딩 종료
      setLoading(false);
    }
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
          {/* 구름 카드 컨테이너 */}
          <View style={{ width: cardWidth, height: cardHeight, justifyContent: 'center', alignItems: 'center' }}>
            
            {/* 구름 배경 */}
            <Image
              source={require('../../../assets/login_background.png')} 
              style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}
              resizeMode="stretch"
            />

            {/* 내부 콘텐츠 */}
            <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: paddingH, paddingVertical: paddingV, zIndex: 10 }}>
              
              {/* 타이틀 */}
              <View style={{ marginBottom: spacing * 1.5 }}>
                 <Text style={{ 
                   fontSize: titleSize, 
                   color: '#AEC7EC', 
                   fontWeight: '900', 
                   textShadowColor: '#000000', 
                   textShadowOffset: { width: 2, height: 2 }, 
                   textShadowRadius: 1 
                 }}>
                  입장하기
                </Text>
              </View>

              {/* [반] [번호] */}
              <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginBottom: spacing }}>
                
                {/* 반 (변수명 grade -> classNumInput으로 변경하여 사용) */}
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F6F8', borderRadius: 20, paddingHorizontal: 12, height: inputHeight }}>
                   <Text style={{ fontSize: fontSizeInput, fontWeight: 'bold', color: '#78909C', marginRight: 5 }}>반</Text>
                   <Ionicons name="school" size={18} color="#D4A373" style={{ marginRight: 5 }} /> 
                   <TextInput
                    style={{ flex: 1, fontSize: fontSizeInput, color: '#455A64', fontWeight: 'bold', textAlign: 'center' }}
                    keyboardType="number-pad"
                    value={classNumInput}
                    onChangeText={setClassNumInput}
                  />
                </View>

                {/* 번호 */}
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F6F8', borderRadius: 20, paddingHorizontal: 12, height: inputHeight }}>
                   <Text style={{ fontSize: fontSizeInput, fontWeight: 'bold', color: '#78909C', marginRight: 5 }}>번호</Text>
                   
                   <View style={{ backgroundColor: '#B0BEC5', borderRadius: 6, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', marginRight: 5 }}>
                     <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>1</Text>
                   </View>

                   <TextInput
                    style={{ flex: 1, fontSize: fontSizeInput, color: '#455A64', fontWeight: 'bold', textAlign: 'center' }}
                    keyboardType="number-pad"
                    value={number}
                    onChangeText={setNumber}
                  />
                </View>
              </View>

              {/* 이름 (왼쪽 정렬) */}
              <View style={{ width: '100%', height: inputHeight, backgroundColor: '#F2D7D5', borderRadius: 20, justifyContent: 'center', paddingHorizontal: 16, marginBottom: spacing }}>
                <TextInput
                  style={{ 
                    width: '100%', 
                    fontSize: fontSizeInput, 
                    color: '#5D4037', 
                    fontWeight: 'bold', 
                    textAlign: 'left'
                  }}
                  placeholder="이름"
                  placeholderTextColor="#BCAAA4"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* 인증코드 */}
              <View style={{ 
                width: '100%', 
                height: inputHeight, 
                backgroundColor: '#FFF9C4', 
                borderRadius: 20, 
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16, 
                marginBottom: spacing * 1.5,
                borderWidth: 2,
                borderColor: '#FBC02D',
                borderStyle: 'dashed'
              }}>
                <Text style={{ fontSize: fontSizeInput, fontWeight: 'bold', color: '#8D6E63', width: 70 }}>인증코드</Text>
                
                <TextInput
                  style={{ flex: 1, fontSize: fontSizeInput, color: '#5D4037', fontWeight: 'bold', textAlign: 'right', marginRight: 10, letterSpacing: 2 }}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={authCode}
                  onChangeText={setAuthCode}
                />
                 <View style={{ backgroundColor: '#FBC02D', borderRadius: 6, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
                     <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>2</Text>
                   </View>
              </View>

              {/* 입장 버튼 (로딩 적용) */}
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleEnter}
                disabled={loading} // 로딩 중 클릭 방지
                style={{ 
                  width: '100%', 
                  height: buttonHeight, 
                  backgroundColor: '#9FA8DA', 
                  borderRadius: 25, 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  shadowColor: "#5C6BC0",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                  opacity: loading ? 0.7 : 1 // 로딩 시 흐리게
                }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: fontSizeInput * 1.3 }}>입장</Text>
                )}
              </TouchableOpacity>

            </View> 

            {/* 로봇 & 장식 */}
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
                source={require('../../../assets/common_Enter.png')} 
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>
            
            <Ionicons name="sparkles" size={24} color="#FFF59D" style={{ position: 'absolute', top: '10%', right: '15%' }} />
            <Ionicons name="star" size={18} color="#FFCC80" style={{ position: 'absolute', bottom: '20%', left: '8%' }} />

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}