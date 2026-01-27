import React, { ReactNode } from 'react'; 
import ClassProgressBar from '../ClassProgressBar';
import TrafficLight from "../TrafficLight";
import AlertButton from "../AlertButton";
import { View, StyleSheet } from "react-native";

// 레이아웃 정리하니까 오버레이가 무시당해서 카메라가 안켜지길래 일단 더미로만 남겨둠
// 나중에 여유 있으면 이걸로 다시 고쳐보고 안될시 그냥 지움

interface LayoutProps {
  children?: ReactNode;
}

export default function ClassScreenLayout({ children }: LayoutProps) {
  return (
    <View style={styles.container}>
      <ClassProgressBar targetMinutes={1} />
      <TrafficLight />
      <AlertButton />
      {children} 
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'transparent'
  },
});