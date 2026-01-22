import React, { useEffect, useState, useRef } from "react";
import { Text, View, StyleSheet, Animated, Easing, Image, Dimensions } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useAppTheme } from "../../context/ThemeContext";
import ThemeImages from "../../context/ThemeImages"; 

const { width } = Dimensions.get('window');
const PROGRESS_BAR_WIDTH = width - 40;

export default function DigitalClassScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [targetMinutes] = useState(1);
  const progress = useRef(new Animated.Value(0)).current;
  const { currentThemeName, theme } = useAppTheme();
  
  const targetTheme = ThemeImages.find(
    t => t.name.toLowerCase() === currentThemeName.toLowerCase()
  );
  
  const themeBackgroundImage = targetTheme?.image;
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

      <View style={styles.bottomOverlay}>
        <View style={styles.overlayContent}>
          {/* 1. 상단 정보 텍스트 */}
          <View style={styles.infoRow}>
            <Text style={styles.loadingText}>수업 목표 달성까지...</Text>
            <Text style={styles.timeText}>{targetMinutes}분</Text>
          </View>
          
          {/* 2. 움직이는 캐릭터 그룹 */}
          <Animated.View style={[styles.imageGroup, { transform: [{ translateX }] }]}>
            <Image 
              source={require('../../../assets/characters/sub_item2.png')} 
              resizeMode="contain"
              style={styles.subImage} 
            />
            <Image 
              source={require('../../../assets/characters/sub_item1.png')} 
              resizeMode="contain"
              style={styles.subImage} 
            />
            <Image 
              source={require('../../../assets/characters/main_character.png')} 
              resizeMode="contain"
              style={styles.mainImage} 
            />
          </Animated.View>

          {/* 3. 프로그레스 바 및 얇은 하단 배경 영역 */}
          <View style={styles.progressBarContainer}>
            {themeBackgroundImage && (
              <Image 
                source={themeBackgroundImage}
                style={styles.backgroundImage}
                resizeMode="cover"
              />
            )}
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
          </View>
        </View>
      </View>
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
    height: 100,
    overflow: 'hidden', 
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  infoRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 2,
    paddingHorizontal: 20,
  },
  imageGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: -12, 
    zIndex: 10,
    paddingHorizontal: 20,
  },
  mainImage: { width: 45, height: 45, marginLeft: 10 },
  subImage: { width: 25, height: 25, marginLeft: -5 },
  progressBarContainer: {
    width: '100%',
    height: 25,
    justifyContent: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: '100%',
    zIndex: -1,
  },
  progressBarBg: {
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  progressBarFill: { height: '100%', borderRadius: 7 },
  
  loadingText: { 
    fontSize: 13, 
    fontWeight: '700', 
    textShadowColor: 'rgba(255, 255, 255, 0.8)', 
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4 
  },
  timeText: { 
    fontSize: 13, 
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 255, 255, 0.8)', 
    textShadowRadius: 4 
  },
});