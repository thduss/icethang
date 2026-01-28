import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';

interface ExpBarProps {
  currentXP: number;
  maxXP: number;
}

export default function ExperienceBar({ currentXP, maxXP }: ExpBarProps) {
  const percentRaw = (currentXP / maxXP) * 100;
  const progress = Math.min(percentRaw, 100);

  return (
    <View style={styles.container}>
      {/* 1. 게이지 배경 */}
      <View style={styles.backgroundBar}>
        {/* 2. 움직이는 초록색 게이지 */}
        <MotiView
          from={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'timing', duration: 1000 }}
          style={styles.gauge}
        />
        
        {/* 3. 중앙 텍스트 (게이지 위에 얹기) */}
        <View style={styles.textOverlay}>
          <Text style={styles.xpText}>
            {currentXP} / {maxXP} 경험치
          </Text>
        </View>

        {/* 4. 오른쪽 별 뱃지 (진행률 표시) */}
        <View style={styles.starBadgeContainer}>
            <View style={styles.starBadge}>
                <Ionicons name="star" size={14} color="#FFD700" style={{marginRight: 2}} />
                <Text style={styles.percentText}>{Math.floor(progress)}%</Text>
            </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    width: '100%', 
    height: 32, 
    justifyContent: 'center',
  },
  backgroundBar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EAEAEA', 
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D4C4A8', 
    overflow: 'hidden', 
    justifyContent: 'center',
  },
  gauge: {
    height: '100%',
    backgroundColor: '#8BC34A', 
  },
  textOverlay: {
    ...StyleSheet.absoluteFillObject, 
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  xpText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  starBadgeContainer: {
    position: 'absolute',
    right: 4,
    height: '100%',
    justifyContent: 'center',
    zIndex: 2,
  },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6D4C41', 
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  percentText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  }
});