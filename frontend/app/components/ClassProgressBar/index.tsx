import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useAppTheme } from '../../context/ThemeContext';
import { RootState } from '../../store/stores';
import itemData from '../../../assets/themes/itemData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  targetMinutes: number;
  showSubImages?: boolean;
  previewBackgroundId?: number | null;
}

export default function ClassProgressBar({
  targetMinutes,
  showSubImages = true,
  previewBackgroundId,
}: Props) {
  const { equippedCharacterId, equippedBackgroundId } = useSelector(
    (state: RootState) => state.theme
  );
  const { theme } = useAppTheme();

  const currentBackground = useMemo(() => {
    if (previewBackgroundId && itemData[previewBackgroundId]) {
      return itemData[previewBackgroundId];
    }

    if (equippedBackgroundId && itemData[equippedBackgroundId]) {
      return itemData[equippedBackgroundId];
    }

    return Object.values(itemData).find(
      item => item.category === 'BACKGROUND'
    );
  }, [previewBackgroundId, equippedBackgroundId]);

  const mainCharacter = useMemo(() => {
    if (equippedCharacterId && itemData[equippedCharacterId]) {
      return itemData[equippedCharacterId];
    }
    return itemData[5];
  }, [equippedCharacterId]);

  const subCharacters = useMemo(() => {
    if (!showSubImages) return [];

    return Object.values(itemData)
      .filter(
        item =>
          item.category === 'CHARACTER' &&
          item.id !== equippedCharacterId
      )
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);
  }, [equippedCharacterId, showSubImages]);

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: targetMinutes * 60 * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [targetMinutes]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH - 40],
  });

  return (
    <View style={styles.bottomOverlay}>
      <View style={styles.infoRow}>
        <Text style={styles.loadingText}>수업 목표 달성까지...</Text>
        <Text style={styles.timeText}>{targetMinutes}분</Text>
      </View>

      <View style={styles.barContainer}>
        {/* 배경 */}
        {currentBackground && (
          <Image
            source={currentBackground.imageActive}
            style={styles.backgroundImage}
            resizeMode="stretch"
          />
        )}

        {/* 프로그레스 바 */}
        <View style={styles.progressBarTrack}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: theme.primary || '#FFD86B',
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* 캐릭터 레이어 */}
        <View style={styles.characterLayer} pointerEvents="none">
          <Animated.View
            style={[styles.imageGroup, { transform: [{ translateX }] }]}
          >
            {mainCharacter && (
              <Image
                source={mainCharacter.imageActive}
                resizeMode="contain"
                style={styles.mainCharImg}
              />
            )}

            {showSubImages &&
              subCharacters.map((char, index) => (
                <Image
                  key={`sub-${char.id}`}
                  source={char.imageActive}
                  resizeMode="contain"
                  style={[
                    styles.subCharImg,
                    { zIndex: -index },
                  ]}
                />
              ))}
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    width: SCREEN_WIDTH,
    height: 100,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
    elevation: 10,
    zIndex: 999,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  barContainer: {
    width: '100%',
    height: 35,
    justifyContent: 'center',
    overflow: 'visible',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  progressBarTrack: {
    height: 16,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  characterLayer: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: -40,
    height: 45,
    overflow: 'visible',
  },
  imageGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'absolute',
    left: -50,
  },
  mainCharImg: {
    width: 110,
    height: 90,
    bottom:50
  },
  subCharImg: {
    width: 40,
    height: 40,
    marginLeft: -6,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  timeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
});
