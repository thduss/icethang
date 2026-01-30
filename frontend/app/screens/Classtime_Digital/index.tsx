import React, { useEffect, useRef } from "react";
import { View, StyleSheet, AppState, Platform, NativeModules } from "react-native";
import { useSelector } from 'react-redux'; 
import { CameraView } from "expo-camera";
import PipHandler, { usePipModeListener } from 'react-native-pip-android';
import TrafficLight from "../../components/TrafficLight";
import { RootState } from '../../store/stores'; // 프로젝트 경로에 맞게 수정 필요
import itemData from '../../../assets/themes/itemData';

const { OverlayModule } = NativeModules;

export default function DigitalClassScreen() {
  const inPipMode = usePipModeListener();
  const appState = useRef(AppState.currentState);

  // Redux에서 현재 장착된 아이템 ID 가져오기
  const { equippedCharacterId, equippedBackgroundId } = useSelector(
    (state: RootState) => state.theme
  );

  // 🚀 한글 이름을 안드로이드 리소스 파일명(영문)으로 매핑하는 함수
  const getCharResName = (name: string) => {
    switch(name) {
      case '기차': return 'char_1';
      case '오토바이': return 'char_2';
      case '트럭': return 'char_3';
      case '배': return 'char_4';
      default: return 'char_1';
    }
  };

  const getBgResName = (name: string) => {
    switch(name) {
      case '도시': return 'city';
      case '숲길': return 'jungle';
      case '우주': return 'universe';
      case '바다': return 'sea';
      default: return 'city';
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      // 앱이 백그라운드로 전환될 때 실행
      if (appState.current === "active" && nextAppState.match(/inactive|background/)) {
        console.log("🔔 배경 진입 감지 - PIP 및 오버레이 실행");

        if (Platform.OS === 'android' && !inPipMode) {
          // 1. PIP 모드 진입
          PipHandler.enterPipMode(300, 300);
          
          // 2. 현재 장착된 아이템 찾기
          const charItem = itemData.find(t => t.id === equippedCharacterId);
          const bgItem = itemData.find(t => t.id === equippedBackgroundId);
          
          // 3. 파일명 매핑 적용
          const charRes = charItem ? getCharResName(charItem.name) : "char_1";
          const bgRes = bgItem ? getBgResName(bgItem.name) : "city";

          console.log(`🚀 오버레이 호출 데이터: 캐릭터(${charRes}), 배경(${bgRes})`);

          // 4. 오버레이 실행
          OverlayModule.showOverlay(
            "수업 진행 중", 
            false, 
            charRes, 
            bgRes, 
            0, 
            0
          );
        }
      } 
      // 앱으로 다시 돌아올 때 오버레이 제거
      else if (nextAppState === "active") {
        OverlayModule.hideOverlay();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      OverlayModule.hideOverlay();
    };
  }, [inPipMode, equippedCharacterId, equippedBackgroundId]);

  return (
    <View style={styles.container}>
      {/* 백그라운드 구동 유지를 위한 더미 카메라 (이미 구현되어 있다면 유지) */}
      <View style={styles.hiddenCamera}><CameraView style={{ flex: 1 }} /></View>
      
      <View style={styles.content}>
        <TrafficLight size={inPipMode ? "small" : "large"} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  hiddenCamera: { position: "absolute", width: 1, height: 1, opacity: 0 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});