import React, { useState, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Image, 
  KeyboardAvoidingView, Platform, ScrollView, 
  useWindowDimensions, Alert, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/stores'; 
import { joinStudent } from '../../store/slices/authSlice'; 

export default function StudentLoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { width: screenWidth } = useWindowDimensions();

  const { loading: isLoading } = useSelector((state: RootState) => state.auth);

  const [classNum, setClassNum] = useState(''); 
  const [number, setNumber] = useState('');     
  const [name, setName] = useState('');         
  const [authCode, setAuthCode] = useState('');

  const numberRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const codeRef = useRef<TextInput>(null);

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

  const handleEnter = async () => {
    if (!classNum || !number || !name || !authCode) {
      Alert.alert("알림", "모든 정보를 입력해주세요.");
      return;
    }

    const resultAction = await dispatch(joinStudent({
      code: authCode,
      name: name,
      number: Number(number)
    }));

    if (joinStudent.fulfilled.match(resultAction)) {
      Alert.alert("환영합니다!", `${name} 학생 입장 성공!`, [
        { text: "확인", onPress: () => router.replace('/screens/Student_Home') }
      ]);
    } else {
      const errorMsg = resultAction.payload as string || "입장에 실패했습니다.";
      Alert.alert("입장 실패", errorMsg, [
        { 
          text: "다시 입력", 
          onPress: () => {
              setAuthCode(''); 
              codeRef.current?.focus(); 
          }
        }
      ]);
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
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ width: cardWidth, height: cardHeight, justifyContent: 'center', alignItems: 'center' }}>
            <Image
              source={require('../../../assets/login_background.png')} 
              style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}
              resizeMode="stretch"
            />

            <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: paddingH, paddingVertical: paddingV, zIndex: 10 }}>
              
              <View style={{ marginBottom: spacing * 1.5 }}>
                 <Text style={{ fontSize: titleSize, color: '#AEC7EC', fontWeight: '900', textShadowColor: '#000000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 1 }}>
                  입장하기
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginBottom: spacing }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F6F8', borderRadius: 20, paddingHorizontal: 12, height: inputHeight }}>
                   <Text style={{ fontSize: fontSizeInput, fontWeight: 'bold', color: '#78909C', marginRight: 5 }}>반</Text>
                   <Ionicons name="school" size={18} color="#D4A373" style={{ marginRight: 5 }} /> 
                   <TextInput
                    style={{ flex: 1, fontSize: fontSizeInput, color: '#455A64', fontWeight: 'bold', textAlign: 'center' }}
                    placeholder="입력"
                    placeholderTextColor="#CFD8DC"
                    keyboardType="number-pad"
                    returnKeyType="next"
                    value={classNum}
                    onChangeText={setClassNum}
                    onSubmitEditing={() => numberRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F6F8', borderRadius: 20, paddingHorizontal: 12, height: inputHeight }}>
                   <Text style={{ fontSize: fontSizeInput, fontWeight: 'bold', color: '#78909C', marginRight: 5 }}>번호</Text>
                   <View style={{ backgroundColor: '#B0BEC5', borderRadius: 6, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', marginRight: 5 }}>
                     <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>No.</Text>
                   </View>
                   <TextInput
                    ref={numberRef}
                    style={{ flex: 1, fontSize: fontSizeInput, color: '#455A64', fontWeight: 'bold', textAlign: 'center' }}
                    placeholder="입력"
                    placeholderTextColor="#CFD8DC"
                    keyboardType="number-pad"
                    returnKeyType="next"
                    value={number}
                    onChangeText={setNumber}
                    onSubmitEditing={() => nameRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>
              </View>

              <View style={{ width: '100%', height: inputHeight, backgroundColor: '#F2D7D5', borderRadius: 20, justifyContent: 'center', paddingHorizontal: 16, marginBottom: spacing }}>
                <TextInput
                  ref={nameRef}
                  style={{ width: '100%', fontSize: fontSizeInput, color: '#5D4037', fontWeight: 'bold', textAlign: 'left' }}
                  placeholder="이름을 입력하세요"
                  placeholderTextColor="#BCAAA4"
                  returnKeyType="next"
                  value={name}
                  onChangeText={setName}
                  onSubmitEditing={() => codeRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>

              <View style={{ width: '100%', height: inputHeight, backgroundColor: '#FFF9C4', borderRadius: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: spacing * 1.5, borderWidth: 2, borderColor: '#FBC02D', borderStyle: 'dashed' }}>
                <Text style={{ fontSize: fontSizeInput, fontWeight: 'bold', color: '#8D6E63', width: 70 }}>인증코드</Text>
                <TextInput
                  ref={codeRef}
                  style={{ flex: 1, fontSize: fontSizeInput, color: '#5D4037', fontWeight: 'bold', textAlign: 'right', marginRight: 10, letterSpacing: 2 }}
                  placeholder="4자리"
                  placeholderTextColor="#F9E79F"
                  keyboardType="default" 
                  maxLength={8} 
                  autoCapitalize="characters"
                  returnKeyType="done"
                  value={authCode}
                  onChangeText={setAuthCode}
                  onSubmitEditing={handleEnter}
                />
                 <View style={{ backgroundColor: '#FBC02D', borderRadius: 6, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
                     <Ionicons name="key" size={12} color="white" />
                   </View>
              </View>

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleEnter}
                disabled={isLoading} 
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
                  opacity: isLoading ? 0.7 : 1 
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: fontSizeInput * 1.3 }}>입장</Text>
                )}
              </TouchableOpacity>

            </View> 

            <View pointerEvents="none" style={{ position: 'absolute', zIndex: 20, width: robotSize, height: robotSize, bottom: -cardHeight * 0.05, left: -cardWidth * 0.18, transform: [{ rotate: '-10deg' }] }}>
              <Image source={require('../../../assets/common_Enter.png')} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            </View>
            
            <Ionicons name="sparkles" size={24} color="#FFF59D" style={{ position: 'absolute', top: '10%', right: '15%' }} />
            <Ionicons name="star" size={18} color="#FFCC80" style={{ position: 'absolute', bottom: '20%', left: '8%' }} />

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}