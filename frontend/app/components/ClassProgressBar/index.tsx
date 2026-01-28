import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Animated, Easing, Image, Dimensions } from "react-native";
import { useSelector } from "react-redux";
import { useAppTheme } from "../../context/ThemeContext";
import ThemeImages from "../../context/ThemeImages";
import { RootState } from "../../store/stores";
import { CharacterAssets } from "../../../assets/themes/AssetMapping";

const { width } = Dimensions.get('window');
const PROGRESS_BAR_MARGIN = 20;
const PROGRESS_BAR_WIDTH = width - (PROGRESS_BAR_MARGIN * 2);

interface ClassProgressBarProps {
  targetMinutes: number;
  showSubImages?: boolean; 
}
const DEFAULT_SOURCE = [
  { theme_id: 10, theme_name: '고양이', theme_category: 'CHARACTER', asset_url: 'cat_01' },
  { theme_id: 11, theme_name: '토끼', theme_category: 'CHARACTER', asset_url: 'rabbit_01' },
  { theme_id: 12, theme_name: '곰', theme_category: 'CHARACTER', asset_url: 'bear_01' },
  { theme_id: 13, theme_name: '강아지', theme_category: 'CHARACTER', asset_url: 'dog_01' },
];

export default function ClassProgressBar({ 
  targetMinutes, 
  showSubImages = true 
}: ClassProgressBarProps) {
  const { allThemes, equippedCharacterId } = useSelector(
    (state: RootState) => state.theme
  );

  const dataSource = useMemo(() => {
    return allThemes.length > 0 ? allThemes : DEFAULT_SOURCE;
  }, [allThemes]);

  const mainCharacter = useMemo(() => {
    const found = dataSource.find(t => t.theme_id === equippedCharacterId && t.theme_category === 'CHARACTER');
    return found;
  }, [dataSource, equippedCharacterId]);

  const subCharacters = useMemo(() => {
    if (!showSubImages) return [];

    const otherCharacters = dataSource.filter(
      t => t.theme_category === 'CHARACTER' && t.theme_id !== equippedCharacterId
    );
    return [...otherCharacters].sort(() => 0.5 - Math.random()).slice(0, 2);
  }, [dataSource, equippedCharacterId, showSubImages]);

  const progress = useRef(new Animated.Value(0)).current;
  const { currentThemeName, theme } = useAppTheme();

  useEffect(() => {
    const durationMs = targetMinutes * 60 * 1000;
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: durationMs,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [targetMinutes]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PROGRESS_BAR_WIDTH],
  });

  const targetTheme = ThemeImages.find(t => t.name.toLowerCase() === currentThemeName.toLowerCase());
  const themeBackgroundImage = targetTheme?.image;

  return (
    <View style={styles.bottomOverlay}>
      <View style={styles.overlayContent}>
        <View style={styles.infoRow}>
          <Text style={styles.loadingText}>수업 목표 달성까지...</Text>
          <Text style={styles.timeText}>{targetMinutes}분</Text>
        </View>

        <View style={styles.progressBarWrapper}>
          {themeBackgroundImage && (
            <Image source={themeBackgroundImage} style={styles.fullWidthBackground} resizeMode="cover" />
          )}

          <View style={styles.progressBarBg}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: theme.primary,
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  })
                }
              ]}
            />
          </View>

          <View style={styles.characterTrack} pointerEvents="none">
            <Animated.View style={[styles.imageGroup, { transform: [{ translateX }] }]}>
              <Image
                source={
                  mainCharacter?.asset_url 
                    ? CharacterAssets[mainCharacter.asset_url] 
                    : require('../../../assets/characters/main_character.png')
                }
                resizeMode="contain"
                style={styles.mainImage}
              />
              {showSubImages && subCharacters.map((char, index) => (
                <Image
                  key={`sub-${char.theme_id}`}
                  source={CharacterAssets[char.asset_url]}
                  resizeMode="contain"
                  style={[
                    styles.subImage, 
                    { zIndex: -index - 1 } 
                  ]}
                />
              ))}
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    overflow: 'visible',
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 2,
    zIndex: 10,
  },
  progressBarWrapper: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  fullWidthBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: 30,
    zIndex: -1,
  },
  characterTrack: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: -35,
    height: 50,
    zIndex: 999,
    overflow: 'visible',
  },
  imageGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'absolute',
    left: -22, 
    bottom: -10,
  },
  mainImage: { 
    width: 45, 
    height: 45,
    zIndex: 10, 
    marginLeft: -10,
  },
  subImage: { 
    width: 25, 
    height: 25, 
    marginLeft: -7 
  },
  progressBarBg: {
    height: 14,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 7 },
  loadingText: { fontSize: 13, fontWeight: '700', paddingBottom: 2 },
  timeText: { fontSize: 13, fontWeight: 'bold', paddingBottom: 2 },
});