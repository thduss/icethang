import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ImageBackground, ScrollView, Dimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux'; 
import { useAppTheme } from '../../context/ThemeContext';
import ClassProgressBar from '../../components/ClassProgressBar';
import { RootState } from '../../store/stores';
import { setEquippedCharacter, setEquippedBackground } from '../../store/slices/themeSlice'; 
import { CharacterAssets, BackgroundAssets } from '../../../assets/themes/AssetMapping'; 

const background = require('../../../assets/theme_background.png');
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PANEL_MARGIN = 30; 
const GAP = 10; 
const VISIBLE_ITEMS = 4; 

const CONTENT_AREA_WIDTH = SCREEN_WIDTH - (PANEL_MARGIN * 2) - 80; 
const CARD_WIDTH = (CONTENT_AREA_WIDTH - (GAP * (VISIBLE_ITEMS - 1))) / VISIBLE_ITEMS; 
const PAGE_WIDTH = CONTENT_AREA_WIDTH + GAP;

const DEFAULT_ITEMS = [ // 로컬에 있는 데이터 지우지말것
  { theme_id: 1, theme_name: '별길', theme_category: 'BACKGROUND', asset_url: 'universe_01' },
  { theme_id: 2, theme_name: '바닷길', theme_category: 'BACKGROUND', asset_url: 'sea_01' },
  { theme_id: 3, theme_name: '숲속 오솔길', theme_category: 'BACKGROUND', asset_url: 'jungle_01' },
  { theme_id: 4, theme_name: '도시', theme_category: 'BACKGROUND', asset_url: 'city_01' },
  { theme_id: 10, theme_name: '기차', theme_category: 'CHARACTER', asset_url: 'cat_01' },
  { theme_id: 11, theme_name: '오토바이', theme_category: 'CHARACTER', asset_url: 'rabbit_01' },
  { theme_id: 12, theme_name: '트럭', theme_category: 'CHARACTER', asset_url: 'bear_01' },
  { theme_id: 13, theme_name: '배', theme_category: 'CHARACTER', asset_url: 'dog_01' },
];

export default function ReusableGridScreen() {
  const dispatch = useDispatch();
  const { setTheme } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null); 
  const [currentOffset, setCurrentOffset] = useState(0); 
  
  const { allThemes, equippedCharacterId, equippedBackgroundId } = useSelector(
    (state: RootState) => state.theme
  );

  const [activeTab, setActiveTab] = useState<'theme' | 'character'>('character');

  const currentItems = useMemo(() => {
    const dataSource = allThemes.length > 0 ? allThemes : DEFAULT_ITEMS;
    return dataSource.filter(item => 
      activeTab === 'theme' ? item.theme_category === 'BACKGROUND' : item.theme_category === 'CHARACTER'
    );
  }, [allThemes, activeTab]);

  const maxOffset = useMemo(() => {
    const totalPages = Math.ceil(currentItems.length / VISIBLE_ITEMS);
    return Math.max(0, (totalPages - 1) * PAGE_WIDTH);
  }, [currentItems]);

  const isLeftDisabled = currentOffset <= 0;
  const isRightDisabled = currentOffset >= maxOffset;

  const moveScroll = (direction: 'left' | 'right') => {
    let nextOffset = direction === 'left' 
      ? currentOffset - PAGE_WIDTH 
      : currentOffset + PAGE_WIDTH;

    nextOffset = Math.max(0, Math.min(nextOffset, maxOffset));
    
    scrollRef.current?.scrollTo({
      x: nextOffset,
      animated: true,
    });
    setCurrentOffset(nextOffset);
  };

  const handleSelect = async (item: any) => {
    if (activeTab === 'theme') {
      const themeKey = item.asset_url.split('_')[0]; 
      setTheme(themeKey);
      dispatch(setEquippedBackground(item.theme_id));
    } else {
      dispatch(setEquippedCharacter(item.theme_id));
    }
  };

  const handleTabChange = (tab: 'theme' | 'character') => {
    setActiveTab(tab);
    setCurrentOffset(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  };

  return (
    <ImageBackground source={background} style={styles.container}>
      <View style={styles.toggleWrapper}>
        <Pressable onPress={() => handleTabChange('character')} style={[styles.topBtn, activeTab !== 'character' && styles.topBtnInactive]}>
          <Text style={styles.topBtnText}>캐릭터</Text>
        </Pressable>
        <Pressable onPress={() => handleTabChange('theme')} style={[styles.topBtn, activeTab !== 'theme' && styles.topBtnInactive]}>
          <Text style={styles.topBtnText}>테마</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>{activeTab === 'theme' ? '테마 선택' : '캐릭터 선택'}</Text>
        </View>

        <View style={styles.carouselWrapper}>
          <Pressable 
            style={styles.arrowBtn} 
            onPress={() => moveScroll('left')}
            disabled={isLeftDisabled}
          >
            <Text style={[styles.arrowText, isLeftDisabled && styles.disabledText]}>◀</Text>
          </Pressable>

          <ScrollView 
            horizontal 
            ref={scrollRef}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            snapToInterval={PAGE_WIDTH}
            decelerationRate="fast"
            onMomentumScrollEnd={(e) => setCurrentOffset(e.nativeEvent.contentOffset.x)}
          >
            {currentItems.map(item => {
              const isSelected = activeTab === 'theme' 
                ? equippedBackgroundId === item.theme_id 
                : equippedCharacterId === item.theme_id;

              const imageSrc = activeTab === 'character' 
                ? CharacterAssets[item.asset_url] 
                : BackgroundAssets[item.asset_url];

              return (
                <Pressable
                  key={item.theme_id}
                  onPress={() => handleSelect(item)}
                  style={[styles.card, isSelected && styles.selectedCard]}
                >
                  <Image source={imageSrc} style={styles.cardImage} />
                  <Text style={styles.cardText} numberOfLines={1}>{item.theme_name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable 
            style={styles.arrowBtn} 
            onPress={() => moveScroll('right')}
            disabled={isRightDisabled}
          >
            <Text style={[styles.arrowText, isRightDisabled && styles.disabledText]}>▶</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.previewArea}>
        {activeTab === 'character' && (
          <Image
            source={
              CharacterAssets[(allThemes.length > 0 ? allThemes : DEFAULT_ITEMS).find(t => t.theme_id === equippedCharacterId)?.asset_url || ''] || 
              CharacterAssets['cat_01']
            }
            style={styles.previewImage}
          />
        )}
        <ClassProgressBar showSubImages={false} targetMinutes={1} />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toggleWrapper: { position: 'absolute', top: 40, left: 40, flexDirection: 'row', gap: 12, zIndex: 10, marginBottom: 20 },
  topBtn: { backgroundColor: '#E6DCC7', paddingHorizontal: 32, paddingVertical: 10, borderRadius: 14, borderWidth: 2, borderColor: '#D6C29A', minWidth: 100, alignItems: 'center' },
  topBtnInactive: { backgroundColor: '#fff' },
  topBtnText: { fontWeight: '600' },
  panel: { marginTop: 100, marginHorizontal: PANEL_MARGIN, paddingBottom: 24, backgroundColor: '#FFFBF2', borderRadius: 26, borderWidth: 3, borderColor: '#D6C29A', overflow: 'hidden' },
  headerBox: { width: '100%', height: 60, backgroundColor: '#E8DCC3', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  carouselWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginTop: 25 },
  scrollContent: { paddingHorizontal: 5 },
  arrowBtn: { padding: 10, width: 45, alignItems: 'center' },
  arrowText: { fontSize: 24, color: '#D6C29A', fontWeight: 'bold' },
  disabledText: { color: '#E0E0E0', opacity: 0.5 },
  card: { 
    width: CARD_WIDTH, 
    height: CARD_WIDTH + 40, 
    borderRadius: 15, 
    backgroundColor: '#fff', 
    overflow: 'hidden', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#DDD',
    marginRight: GAP,
  },
  selectedCard: { borderWidth: 4, borderColor: '#FFD86B' },
  cardImage: { width: '100%', height: '70%' },
  cardText: { marginTop: 4, fontSize: 11, fontWeight: '600' },
  previewArea: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  previewImage: { width: 130, height: 130 },
});