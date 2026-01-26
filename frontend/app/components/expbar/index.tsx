import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { useAppSelector } from '../../store/hooks';

export default function ExperienceBar() {
  const currentXP = useAppSelector(state => state.auth.studentData?.current_xp || 0); //서버와 통신 후 받아옴
  const maxXP = 100; // 나중에 협의 후 수정 필요
  // 레벨업시 초기화할거면 수정하면 된다
  
  const progress = (currentXP / maxXP) * 100;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>EXP: {currentXP} / {maxXP}</Text>
      
      <View style={styles.backgroundBar}>
        <MotiView
          from={{ width: '0%' }} 
          animate={{ width: `${progress}%` }} 
          transition={{
            type: 'timing',
            duration: 800, 
          }}
          style={styles.gauge}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', padding: 20 },
  label: { marginBottom: 8, fontWeight: 'bold' },
  backgroundBar: {
    width: '100%',
    height: 15,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden', 
  },
  gauge: {
    height: '100%',
    backgroundColor: '#8adb39'
  },
});