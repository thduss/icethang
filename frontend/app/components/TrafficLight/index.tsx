import React from "react";
import { View, StyleSheet } from "react-native";

interface TrafficLightProps {
  size?: "small" | "large"; 
}

export default function TrafficLight({ size = "large" }: TrafficLightProps) {
  const isSmall = size === "small";

  return (
    <View style={[styles.container, isSmall && styles.smallContainer]}>
      <View style={[styles.light, isSmall && styles.smallLight, { backgroundColor: 'red' }]} />
      <View style={[styles.light, isSmall && styles.smallLight, { backgroundColor: '#333' }]} />
      <View style={[styles.light, isSmall && styles.smallLight, { backgroundColor: '#333' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 100, height: 260, backgroundColor: "#333", borderRadius: 20, padding: 10, justifyContent: 'space-around' },
  smallContainer: { width: 40, height: 110, borderRadius: 10, padding: 5 },
  light: { width: 80, height: 80, borderRadius: 40 },
  smallLight: { width: 30, height: 30, borderRadius: 15 },
});