import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface HeaderProps {
  className: string;
  participantCount: number;
  onEndClass: () => void;
}

export const Header = ({ className, participantCount, onEndClass }: HeaderProps) => {
  const [isTabletMode, setIsTabletMode] = useState<boolean>(true);

  const toggleSwitch = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsTabletMode(!isTabletMode);
  };

  return (
    <View style={styles.headerContainer}>
      
      {/* 커스텀 토글 */}
      <View style={styles.toggleWrapper}>
        <Text style={[styles.toggleText, isTabletMode && styles.activeText]}>
          태블릿 수업
        </Text>

        <TouchableOpacity 
          style={styles.customSwitchTrack} 
          activeOpacity={0.9} 
          onPress={toggleSwitch}
        >
          <View style={[
            styles.customSwitchThumb, 
            { alignSelf: isTabletMode ? 'flex-start' : 'flex-end' } 
          ]} />
        </TouchableOpacity>

        <Text style={[styles.toggleText, !isTabletMode && styles.activeText]}>
          일반 수업
        </Text>
      </View>

      {/* 반 정보 */}
      <Text style={styles.infoText}>
        {className} | 참여 : {participantCount}명
      </Text>

      {/* 종료 버튼 */}
      <TouchableOpacity 
        style={styles.endButton} 
        onPress={onEndClass}
        activeOpacity={0.8}
      >
        <Text style={styles.endButtonText}>수업 종료</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3EFE9',
    marginHorizontal: 15,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#8D7B68',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  toggleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: '#B0A090',
    fontWeight: '500',
    marginHorizontal: 4,
  },
  activeText: {
    color: '#4A3B32',
    fontWeight: 'bold',
  },

  customSwitchTrack: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#7FA864',
    borderWidth: 1,
    borderColor: '#6E9255',
    justifyContent: 'center',
    padding: 2,
    marginHorizontal: 4,
  },
  customSwitchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },

  infoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5D4037',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  endButton: {
    backgroundColor: '#7FA864',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 1,
  },
  endButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});