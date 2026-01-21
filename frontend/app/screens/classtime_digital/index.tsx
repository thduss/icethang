import React, { useEffect, useState, useRef } from "react";
import { Text, View, StyleSheet, Animated, Easing, Image, Dimensions, ImageBackground } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useAppTheme } from "../../context/ThemeContext";
import ThemeImgages from "../../context/ThemeImages";

const { width } = Dimensions.get('window');
const PROGRESS_BAR_WIDTH = width - 40; // 좌우 패딩 20씩 제외

export default function DigitalClassScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [targetMinutes] = useState(1); // 분 설정
  const progress = useRef(new Animated.Value(0)).current;
  const { currentThemeName, theme } = useAppTheme();
  
  // 현재 테마의 이미지와 색상 가져오기
  const themeImage = ThemeImgages.find(t => t.name.toLowerCase() === currentThemeName.toLowerCase())?.image;
  const progressBarColor = theme.primary;

  useEffect(() => {
    if (permission?.status === "granted") {
      startLoading();
    } else {
      requestPermission();
    }
  }, [permission?.status]);

  const startLoading = () => {
    const durationMs = targetMinutes * 60 * 1000;
    Animated.timing(progress, {
      toValue: 1,
      duration: durationMs,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  };

  // 진행도에 따른 이미지 이동 거리 계산
const translateX = progress.interpolate({
  inputRange: [0, 1],
  outputRange: [-100, PROGRESS_BAR_WIDTH - 100], 
});

  if (!permission || permission.status !== "granted") {
    return <View style={styles.container}><Text>권한 확인 중...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.hiddenCamera}>
        <CameraView style={{ flex: 1 }} facing="back" />
      </View>

      {/* 하단 고정 오버레이 */}
      <ImageBackground 
        source={themeImage}
        style={styles.bottomOverlay}
        imageStyle={styles.backgroundImage}
      >

                      <View style={styles.infoRow}>
          <Text style={[styles.loadingText]}>수업 목표 달성까지...</Text>
          <Text style={[styles.timeText]}>{targetMinutes}분</Text>
        </View>
        
        {/* 로딩 바 위에 움직이는 이미지 그룹 */}
        <Animated.View style={[styles.imageGroup, { transform: [{ translateX }] }]}>


          {/* 뒤따라오는 작은 요소들 */}
          <Image 
            source={require('../../../assets/characters/sub_item2.png')} 
            style={styles.subImage} 
          />
          <Image 
            source={require('../../../assets/characters/sub_item1.png')} 
            style={styles.subImage} 
          />
          {/* 메인 요소 (가장 크고 맨 앞에 배치) */}
          {/* 나중에 이미지 요소들을 DB에서 받아와서 TRUE면 에셋에서 들고오는걸로 (선택이 되느냐 안되느냐)*/}
          <Image 
            source={require('../../../assets/characters/main_character.png')} 
            style={styles.mainImage} 
          />
        </Animated.View>

        <View style={styles.progressBarBg}>
          <Animated.View 
            style={[
              styles.progressBarFill, 
              { 
                backgroundColor: progressBarColor,
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                }) 
              }
            ]} 
          />
        </View>


      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  hiddenCamera: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60, // 이미지 공간 확보를 위해 높이 증가
    paddingHorizontal: 20,
    justifyContent: 'center',
    overflow: 'visible',
  },
  backgroundImage: {
    resizeMode: 'repeat',
    alignSelf: 'flex-end',
  },
  // 이미지들이 로딩 바 위에서 한 줄로 서있게 함
  imageGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: -12, // 로딩 바에 발이 닿는 느낌을 주기 위해 조정
    zIndex: 10,
  },
  themeImage: {
    width: 50,
    height: 50,
    marginRight: 5,
    resizeMode: 'contain',
  },
  mainImage: {
    width: 45,
    height: 45,
    marginLeft: 10,
    resizeMode: 'contain',
  },
  subImage: {
    width: 25,
    height: 25,
    marginLeft: -5, // 겹쳐서 줄 서있는 느낌 유도
    opacity: 1,
    resizeMode: 'contain',
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressBarFill: {
    height: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loadingText: { color: '#ffffff', fontSize: 12, fontWeight: '600', bottom: -12 },
  timeText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', bottom: -12},
});