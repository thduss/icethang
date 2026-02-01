import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ImageBackground, ScrollView, Dimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useAppTheme } from '../../context/ThemeContext';
import ClassProgressBar from '../../components/ClassProgressBar';
import { RootState, AppDispatch } from '../../store/stores';
import { fetchAllThemes, equipTheme } from '../../store/slices/themeSlice';

const background = require('../../../assets/theme_background.png');
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PANEL_MARGIN = 30;
const GAP = 12;
const VISIBLE_ITEMS = 4;

const CONTAINER_INNER_WIDTH = SCREEN_WIDTH - (PANEL_MARGIN * 2) - 100;
const CARD_WIDTH = Math.floor((CONTAINER_INNER_WIDTH - (GAP * (VISIBLE_ITEMS - 1))) / VISIBLE_ITEMS);
const PAGE_WIDTH = CARD_WIDTH + GAP;

type ThemeType = "blue" | "jungle" | "universe" | "city" | "sea";

export default function ReusableGridScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { setTheme } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);

  const [activeTab, setActiveTab] = useState<'theme' | 'character'>('character');
  const [currentOffset, setCurrentOffset] = useState(0);

  const {
    myCharacters,
    myBackgrounds,
    equippedCharacterId,
    equippedBackgroundId
  } = useSelector((state: RootState) => state.theme);


  const studentId = useSelector(
    (state: RootState) => state.auth.studentData?.studentId
  );

  useEffect(() => {
    if (studentId) {
      dispatch(fetchAllThemes(studentId));
    }
  }, [dispatch, studentId]);


  const currentItems = useMemo(() => {
    if (activeTab === 'character') {
      return myCharacters ?? [];
    }
    return myBackgrounds ?? [];
  }, [activeTab, myCharacters, myBackgrounds]);

  const maxOffset = useMemo(() => {
    const totalItemsWidth = (currentItems.length * CARD_WIDTH) + ((currentItems.length - 1) * GAP);
    const visibleAreaWidth = (CARD_WIDTH * VISIBLE_ITEMS) + (GAP * (VISIBLE_ITEMS - 1));
    return Math.max(0, totalItemsWidth - visibleAreaWidth);
  }, [currentItems]);

  const isLeftDisabled = currentOffset <= 5;
  const isRightDisabled = currentOffset >= maxOffset - 5;

  const moveScroll = (direction: 'left' | 'right') => {
    let nextOffset =
      direction === 'left'
        ? currentOffset - PAGE_WIDTH
        : currentOffset + PAGE_WIDTH;

    nextOffset = Math.max(0, Math.min(nextOffset, maxOffset));
    scrollRef.current?.scrollTo({ x: nextOffset, animated: true });
    setCurrentOffset(nextOffset);
  };

  const handleSelect = async (item: any) => {
    const category = activeTab === 'theme' ? 'BACKGROUND' : 'CHARACTER';

    try {
      await dispatch(equipTheme({ id: item.id, category })).unwrap();

      if (category === 'BACKGROUND') {
        const themeKey = item.name.split('_')[0];
        const valid: ThemeType[] = [
          'blue',
          'jungle',
          'universe',
          'city',
          'sea',
        ];
        setTheme(
          valid.includes(themeKey as ThemeType)
            ? (themeKey as ThemeType)
            : 'jungle'
        );
      }
    } catch (e) {
      console.error('테마 장착 실패', e);
    }
  };

  const handleTabChange = (tab: 'theme' | 'character') => {
    setActiveTab(tab);
    setCurrentOffset(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  };

  // 캐릭터 미리보기
  const previewCharacter = (myCharacters ?? []).find(
    c => c.id === equippedCharacterId
  );

  return (
    <ImageBackground source={background} style={styles.container}>
      <View style={styles.toggleWrapper}>
        <Pressable onPress={() => handleTabChange('character')}
          style={[styles.topBtn, activeTab !== 'character' && styles.topBtnInactive]}>
          <Text style={styles.topBtnText}>캐릭터</Text>
        </Pressable>
        <Pressable
          onPress={() => handleTabChange('theme')}
          style={[
            styles.topBtn,
            activeTab !== 'theme' && styles.topBtnInactive
          ]}
        >
          <Text style={styles.topBtnText}>테마</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>
            {activeTab === 'theme' ? '테마 선택' : '캐릭터 선택'}
          </Text>
        </View>

        <View style={styles.carouselWrapper}>
          <Pressable
            style={styles.arrowBtn}
            onPress={() => moveScroll('left')}
            disabled={isLeftDisabled}
          >
            <Text
              style={[
                styles.arrowText,
                isLeftDisabled && styles.disabledText
              ]}>◀</Text>
          </Pressable>

          <View style={styles.scrollViewContainer}>
            <ScrollView
              horizontal
              ref={scrollRef}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              snapToInterval={PAGE_WIDTH}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => setCurrentOffset(e.nativeEvent.contentOffset.x)}
            >
              {currentItems.map((item, index) => {
                const isSelected = activeTab === 'theme'
                  ? equippedBackgroundId === item.id
                  : equippedCharacterId === item.id;

                const isBG = item.category === 'BACKGROUND';

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleSelect(item)}
                    style={[
                      styles.card,
                      isSelected && styles.selectedCard,
                      index === currentItems.length - 1 && { marginRight: 0 }
                    ]}
                  >
                    <Image
                      source={{ uri: BASE_URL + item.assetUrl }}
                      style={
                        activeTab === 'character'
                          ? styles.charImage
                          : styles.bgFullImage
                      }
                      resizeMode="contain"
                    />
                    <Text
                      style={
                        activeTab === 'character'
                          ? styles.charCardText
                          : styles.bgCardText
                      }
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <Pressable style={styles.arrowBtn} onPress={() => moveScroll('right')} disabled={isRightDisabled}>
            <Text style={[styles.arrowText, isRightDisabled && styles.disabledText]}>▶</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.previewArea}>
        {activeTab === 'character' && previewCharacter && (
          <Image
            source={{ uri: BASE_URL + previewCharacter.assetUrl }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        )}
        <ClassProgressBar showSubImages={false} targetMinutes={1} />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toggleWrapper: { position: 'absolute', top: 40, left: 40, flexDirection: 'row', gap: 12, zIndex: 10 },
  topBtn: { backgroundColor: '#E6DCC7', paddingHorizontal: 32, paddingVertical: 10, borderRadius: 14, borderWidth: 2, borderColor: '#D6C29A', minWidth: 100, alignItems: 'center' },
  topBtnInactive: { backgroundColor: '#fff' },
  topBtnText: { fontWeight: '600' },
  panel: { marginTop: 100, marginHorizontal: PANEL_MARGIN, paddingBottom: 24, backgroundColor: '#FFFBF2', borderRadius: 26, borderWidth: 3, borderColor: '#D6C29A', overflow: 'hidden' },
  headerBox: { width: '100%', height: 60, backgroundColor: '#E8DCC3', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  carouselWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 25, paddingHorizontal: 5 },
  scrollViewContainer: { width: (CARD_WIDTH * VISIBLE_ITEMS) + (GAP * (VISIBLE_ITEMS - 1)), overflow: 'hidden' },
  scrollContent: { paddingVertical: 5 },
  arrowBtn: { width: 45, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 24, color: '#D6C29A', fontWeight: 'bold' },
  disabledText: { color: '#E0E0E0', opacity: 0.5 },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH + 45,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DDD',
    marginRight: GAP,
    overflow: 'hidden',
  },
  selectedCard: { borderWidth: 4, borderColor: '#FFD86B' },
  charImage: { width: '80%', height: '60%' },
  charCardText: { marginTop: 4, fontSize: 11, fontWeight: '700' },
  bgFullImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  bgTextBadge: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  bgCardText: { fontSize: 10, fontWeight: '800', color: '#333' },

  previewArea: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  previewImage: { width: 130, height: 130 },
});