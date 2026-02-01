import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ImageBackground,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useAppTheme } from '../../context/ThemeContext';
import ClassProgressBar from '../../components/ClassProgressBar';
import { RootState, AppDispatch } from '../../store/stores';
import {
  fetchAllCharacters,
  fetchAllBackgrounds,
  equipTheme,
} from '../../store/slices/themeSlice';
import type { ThemeItem } from '../../store/slices/themeSlice';


import itemData from '../../../assets/themes/itemData';

const background = require('../../../assets/theme_background.png');


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PANEL_MARGIN = 30;
const GAP = 12;
const VISIBLE_ITEMS = 4;

const CONTAINER_INNER_WIDTH = SCREEN_WIDTH - PANEL_MARGIN * 2 - 100;
const CARD_WIDTH = Math.floor(
  (CONTAINER_INNER_WIDTH - GAP * (VISIBLE_ITEMS - 1)) / VISIBLE_ITEMS
);
const PAGE_WIDTH = CARD_WIDTH + GAP;

type ThemeType = 'blue' | 'jungle' | 'universe' | 'city' | 'sea';

export default function ReusableGridScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { setTheme } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);

  const [activeTab, setActiveTab] =
    useState<'theme' | 'character'>('character');
  const [currentOffset, setCurrentOffset] = useState(0);

  const {
    allCharacters,
    allBackgrounds,
    equippedCharacterId,
    equippedBackgroundId,
  } = useSelector((state: RootState) => state.theme);

  const studentId = useSelector(
    (state: RootState) => state.auth.studentData?.studentId
  );


  useEffect(() => {
    if (!studentId) return;
    dispatch(fetchAllCharacters(studentId));
    dispatch(fetchAllBackgrounds());
  }, [dispatch, studentId]);


  const currentItems: ThemeItem[] = useMemo(() => {
    return activeTab === 'character'
      ? allCharacters
      : allBackgrounds;
  }, [activeTab, allCharacters, allBackgrounds]);


  const maxOffset = useMemo(() => {
    const total =
      currentItems.length * CARD_WIDTH +
      (currentItems.length - 1) * GAP;
    const visible =
      CARD_WIDTH * VISIBLE_ITEMS + GAP * (VISIBLE_ITEMS - 1);
    return Math.max(0, total - visible);
  }, [currentItems]);

  const moveScroll = (direction: 'left' | 'right') => {
    let next =
      direction === 'left'
        ? currentOffset - PAGE_WIDTH
        : currentOffset + PAGE_WIDTH;

    next = Math.max(0, Math.min(next, maxOffset));
    scrollRef.current?.scrollTo({ x: next, animated: true });
    setCurrentOffset(next);
  };


  const getImageSource = (
    item: ThemeItem,
    isSelected: boolean
  ) => {
    const localItem = itemData.find(
      d => d.name === item.name && d.category === item.category
    );

    if (!localItem) return null;

    return isSelected
      ? localItem.imageActive
      : localItem.imageInactive;
  };


  const handleSelect = async (item: ThemeItem) => {
    try {
      await dispatch(
        equipTheme({ id: item.id, category: item.category })
      ).unwrap();

      if (item.category === 'BACKGROUND') {
        const themeKey = item.name.split('_')[0] as ThemeType;
        const valid: ThemeType[] = [
          'blue',
          'jungle',
          'universe',
          'city',
          'sea',
        ];
        setTheme(valid.includes(themeKey) ? themeKey : 'jungle');
      }
    } catch (e) {
      console.error('장착 실패', e);
    }
  };

  const previewCharacter = allCharacters.find(
    c => c.id === equippedCharacterId
  );

  const previewItem = previewCharacter
    ? itemData.find(
      d =>
        d.name === previewCharacter.name &&
        d.category === 'CHARACTER'
    )
    : null;


  return (
    <ImageBackground source={background} style={styles.container}>
      {/* 탭 */}
      <View style={styles.toggleWrapper}>
        <Pressable
          onPress={() => setActiveTab('character')}
          style={[
            styles.topBtn,
            activeTab !== 'character' && styles.topBtnInactive,
          ]}
        >
          <Text style={styles.topBtnText}>캐릭터</Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('theme')}
          style={[
            styles.topBtn,
            activeTab !== 'theme' && styles.topBtnInactive,
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
          <Pressable style={styles.arrowBtn} onPress={() => moveScroll('left')}>
            <Text style={styles.arrowText}>◀</Text>
          </Pressable>

          <View style={styles.scrollViewContainer}>
            <ScrollView
              horizontal
              ref={scrollRef}
              showsHorizontalScrollIndicator={false}
              snapToInterval={PAGE_WIDTH}
              decelerationRate="fast"
              contentContainerStyle={styles.scrollContent}
              onMomentumScrollEnd={e =>
                setCurrentOffset(e.nativeEvent.contentOffset.x)
              }
            >
              {currentItems.map((item, index) => {
                const isSelected =
                  item.category === 'CHARACTER'
                    ? equippedCharacterId === item.id
                    : equippedBackgroundId === item.id;

                const isLocked =
                  item.category === 'CHARACTER' && !item.unlocked;

                return (
                  <Pressable
                    key={`${item.category}-${item.id}-${index}`}
                    disabled={isLocked}
                    onPress={() => !isLocked && handleSelect(item)}
                    style={[
                      styles.card,
                      isSelected && styles.selectedCard,
                      isLocked && styles.lockedCard,
                    ]}
                  >
                    <Image
                      source={getImageSource(item, isSelected)}
                      style={[
                        item.category === 'CHARACTER'
                          ? styles.charImage
                          : styles.bgFullImage,
                        isLocked && styles.lockedImage,
                      ]}
                      resizeMode="contain"
                    />


                    {isLocked && (
                      <View style={styles.lockOverlay}>
                        <Text style={styles.lockText}>🔒</Text>
                      </View>
                    )}

                    <Text style={styles.cardText}>{item.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <Pressable style={styles.arrowBtn} onPress={() => moveScroll('right')}>
            <Text style={styles.arrowText}>▶</Text>
          </Pressable>
        </View>
      </View>

      {/* 미리보기 */}
      <View style={styles.previewArea}>
        {activeTab === 'character' && previewItem && (
          <Image
            source={previewItem.imageActive}
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

  toggleWrapper: {
    position: 'absolute',
    top: 40,
    left: 40,
    flexDirection: 'row',
    gap: 12,
    zIndex: 10,
  },

  topBtn: {
    backgroundColor: '#E6DCC7',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D6C29A',
    minWidth: 100,
    alignItems: 'center',
  },

  topBtnInactive: { backgroundColor: '#FFFFFF' },

  topBtnText: { fontWeight: '600', fontSize: 14 },

  panel: {
    marginTop: 100,
    marginHorizontal: PANEL_MARGIN,
    paddingBottom: 24,
    backgroundColor: '#FFFBF2',
    borderRadius: 26,
    borderWidth: 3,
    borderColor: '#D6C29A',
    overflow: 'hidden',
  },

  headerBox: {
    width: '100%',
    height: 60,
    backgroundColor: '#E8DCC3',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: { fontSize: 18, fontWeight: '700' },

  carouselWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    paddingHorizontal: 5,
  },

  scrollViewContainer: {
    width: CARD_WIDTH * VISIBLE_ITEMS + GAP * (VISIBLE_ITEMS - 1),
    overflow: 'hidden',
  },

  scrollContent: { paddingVertical: 6 },

  arrowBtn: { width: 45, alignItems: 'center', justifyContent: 'center' },

  arrowText: { fontSize: 24, color: '#D6C29A', fontWeight: 'bold' },

  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH + 45,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DDD',
    marginRight: GAP,
    overflow: 'hidden',
  },

  selectedCard: { borderWidth: 4, borderColor: '#FFD86B' },

  lockedCard: { opacity: 0.45 },

  charImage: { width: '80%', height: '60%' },

  bgFullImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },

  cardText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },

  lockedImage: {
    opacity: 0.25,
    tintColor: '#000',
  },

  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  lockText: {
    fontSize: 30,
    color: '#333',
    marginTop: 4,
  },

  previewArea: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },

  previewImage: {
    width: 130,
    height: 130,
    marginBottom: 12,
  },
});
