import React from "react";
import { View, StyleSheet } from "react-native";

interface TrafficLightProps {
  size?: "small" | "large";
  status: string; 
}

export default function TrafficLight({ size = "large", status }: TrafficLightProps) {
  const isSmall = size === "small";

  const isRed = status === "AWAY";   
  const isYellow = ["UNFOCUS", "SLEEPING", "GAZE OFF", "MOVING", "BLINKING"].includes(status); 
  
  const isGreen = status === "FOCUS" || status === "FOCUSED"; 

  return (
    <View style={[styles.container, isSmall && styles.smallContainer]}>
      <View 
        style={[
          styles.light, 
          isSmall && styles.smallLight, 
          { backgroundColor: isRed ? '#F44336' : '#222' } 
        ]} 
      />
      
      <View 
        style={[
          styles.light, 
          isSmall && styles.smallLight, 
          { backgroundColor: isYellow ? '#FFEB3B' : '#222' } 
        ]} 
      />
      
      {/* 초록불 */}
      <View 
        style={[
          styles.light, 
          isSmall && styles.smallLight, 
          { backgroundColor: isGreen ? '#4CAF50' : '#222' } 
        ]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    width: 100, 
    height: 260, 
    backgroundColor: "#333", 
    borderRadius: 20, 
    padding: 10, 
    justifyContent: 'space-around',
    alignItems: 'center' 
  },
  smallContainer: { width: 40, height: 110, borderRadius: 10, padding: 5 },
  light: { width: 80, height: 80, borderRadius: 40 },
  smallLight: { width: 30, height: 30, borderRadius: 15 },
});