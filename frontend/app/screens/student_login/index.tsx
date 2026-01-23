import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function StudentLoginScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  // 📝 입력 상태 관리
  const [grade, setGrade] = useState('');
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [authCode, setAuthCode] = useState('');

  // 📐 [크기 설정]
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

  // 🚀 입장 기능
  const handleEnter = () => {
    // 1. 빈칸 체크
    if (!grade || !number || !name || !authCode) {
      Alert.alert("알림", "모든 정보를 입력해주세요.");
      return;
    }

    // 2. 🔐 인증코드 확인 (정답: 1234)
    const CORRECT_CODE = "1234"; 

    if (authCode !== CORRECT_CODE) {
      Alert.alert("입장 실패", "인증코드가 올바르지 않습니다.\n선생님께 코드를 다시 확인해주세요.", [
        { 
            text: "다시 입력", 
            onPress: () => setAuthCode('') 
        }
      ]);
      return; 
    }

    // 3. 성공 시 입장
    Alert.alert("환영합니다!", `${name} 학생 입장!`, [
      { text: "확인", onPress: () => router.push('/screens/student_home') }
    ]);
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
          {/* ☁️ 구름 카드 컨테이너 */}
          <View style={{ width: cardWidth, height: cardHeight, justifyContent: 'center', alignItems: 'center' }}>
            
            {/* 구름 배경 */}
            <Image
              source={require('../../../assets/login_background.png')} 
              style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}
              resizeMode="stretch"
            />

            {/* 📝 내부 콘텐츠 */}
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

              {/* 1️⃣ [반] [번호] */}
              <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginBottom: spacing }}>
                
                {/* 반 */}
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F6F8', borderRadius: 20, paddingHorizontal: 12, height: inputHeight }}>
                   <Text style={{ fontSize: fontSizeInput, fontWeight: 'bold', color: '#78909C', marginRight: 5 }}>반</Text>
                   <Ionicons name="school" size={18} color="#D4A373" style={{ marginRight: 5 }} /> 
                   <TextInput
                    style={{ flex: 1, fontSize: fontSizeInput, color: '#455A64', fontWeight: 'bold', textAlign: 'center' }}
                    keyboardType="number-pad"
                    value={grade}
                    onChangeText={setGrade}
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

              {/* 2️⃣ 이름 (왼쪽 정렬) */}
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

              {/* 3️⃣ 인증코드 */}
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

              {/* 🚀 입장 버튼 */}
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleEnter}
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
                  elevation: 4
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: fontSizeInput * 1.3 }}>입장</Text>
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
            
            {/* ✨ 장식 아이콘 */}
            <Ionicons name="sparkles" size={24} color="#FFF59D" style={{ position: 'absolute', top: '10%', right: '15%' }} />
            <Ionicons name="star" size={18} color="#FFCC80" style={{ position: 'absolute', bottom: '20%', left: '8%' }} />

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}