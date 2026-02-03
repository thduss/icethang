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

type TabType = 'character' | 'theme';

export default function ReusableGridScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { setTheme } = useAppTheme();

  const [activeTab, setActiveTab] = useState<TabType>('character');
  const [previewBackgroundId, setPreviewBackgroundId] = useState<number | null>(null);

  const scrollRefs = {
    character: useRef<ScrollView>(null),
    theme: useRef<ScrollView>(null),
  };

  const [offsets, setOffsets] = useState<Record<TabType, number>>({
    character: 0,
    theme: 0,
  });

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
    if (activeTab === 'character') {
      dispatch(fetchAllCharacters(studentId));
    } else {
      dispatch(fetchAllBackgrounds());
    }
  }, [dispatch, studentId, activeTab]);

  // 🚀 탭 변경 시 프리뷰 초기화 로직 유지하되, 현재 장착된 것으로 동기화 가능
  useEffect(() => {
    if (activeTab !== 'theme') {
      setPreviewBackgroundId(null);
    }
  }, [activeTab]);

  const currentItems: ThemeItem[] = useMemo(() => {
    return activeTab === 'character' ? allCharacters : allBackgrounds;
  }, [activeTab, allCharacters, allBackgrounds]);

  const maxOffset = useMemo(() => {
    const total = currentItems.length * CARD_WIDTH + (currentItems.length - 1) * GAP;
    const visible = CARD_WIDTH * VISIBLE_ITEMS + GAP * (VISIBLE_ITEMS - 1);
    return Math.max(0, total - visible);
  }, [currentItems]);

  const handleScrollEnd = (tab: TabType) => (e: any) => {
    const x = e?.nativeEvent?.contentOffset?.x;
    if (typeof x !== 'number') return;
    setOffsets(prev => ({ ...prev, [tab]: x }));
  };

  const moveScroll = (tab: TabType, direction: 'left' | 'right') => {
    const current = offsets[tab];
    let next = direction === 'left' ? current - PAGE_WIDTH : current + PAGE_WIDTH;
    next = Math.max(0, Math.min(next, maxOffset));
    scrollRefs[tab].current?.scrollTo({ x: next, animated: true });
    setOffsets(prev => ({ ...prev, [tab]: next }));
  };

  const getImageSource = (item: ThemeItem, isSelected: boolean, isLocked: boolean) => {
    const localItem = itemData[item.id];
    if (!localItem) return null;
    if (isLocked) return localItem.imageInactive;
    return isSelected ? localItem.imageActive : localItem.imageInactive;
  };

  const handleSelect = async (item: ThemeItem) => {
    if (!studentId) return;

    try {
      // 🚀 배경일 경우 프리뷰 상태 즉시 업데이트
      if (item.category === 'BACKGROUND') {
        setPreviewBackgroundId(item.id);
      }

      await dispatch(
        equipTheme({
          id: item.id,
          category: item.category,
          studentId,
        })
      ).unwrap();
    } catch (e) {
      console.error('장착 실패', e);
    }
  };

  const previewCharacter = allCharacters.find(c => c.id === equippedCharacterId);
  const previewItem = previewCharacter ? itemData[previewCharacter.id] : null;

  return (
    <ImageBackground source={background} style={styles.container}>
      <View style={styles.toggleWrapper}>
        <Pressable
          onPress={() => setActiveTab('character')}
          style={[styles.topBtn, activeTab !== 'character' && styles.topBtnInactive]}
        >
          <Text style={styles.topBtnText}>캐릭터</Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('theme')}
          style={[styles.topBtn, activeTab !== 'theme' && styles.topBtnInactive]}
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
          <Pressable style={styles.arrowBtn} onPress={() => moveScroll(activeTab, 'left')}>
            <Text style={styles.arrowText}>◀</Text>
          </Pressable>

          <View style={styles.scrollViewContainer}>
            <ScrollView
              key={activeTab}
              horizontal
              ref={scrollRefs[activeTab]}
              showsHorizontalScrollIndicator={false}
              snapToInterval={PAGE_WIDTH}
              decelerationRate="fast"
              contentContainerStyle={styles.scrollContent}
              onMomentumScrollEnd={handleScrollEnd(activeTab)}
            >
              {currentItems.map((item, index) => {
                const isSelected = item.category === 'CHARACTER'
                    ? equippedCharacterId === item.id
                    : (previewBackgroundId === item.id || equippedBackgroundId === item.id);

                const isLocked = item.category === 'CHARACTER' && !item.unlocked;

                return (
                  <Pressable
                    key={`${item.category}-${item.id}-${index}`}
                    disabled={isLocked}
                    onPress={() => !isLocked && handleSelect(item)}
                    style={[styles.card, isSelected && styles.selectedCard]}
                  >
                    <View style={styles.imageWrapper}>
                      <Image
                        source={getImageSource(item, isSelected, isLocked)}
                        style={[
                          item.category === 'CHARACTER' ? styles.charImage : styles.bgFullImage,
                          isLocked && styles.silhouetteImage,
                        ]}
                        resizeMode={item.category === 'BACKGROUND' ? 'cover' : 'contain'}
                      />
                      {isLocked && (
                        <View style={styles.lockOverlay}>
                          <Text style={styles.lockText}>🔒</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.cardText, isSelected && styles.selectedText]}>
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <Pressable style={styles.arrowBtn} onPress={() => moveScroll(activeTab, 'right')}>
            <Text style={styles.arrowText}>▶</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.previewArea}>
        {/* 캐릭터 프리뷰 (장착된 캐릭터 기준) */}
        {previewItem && (
          <Image
            source={previewItem.imageActive}
            style={styles.previewImage}
            resizeMode="contain"
          />
        )}

        {/* 🚀 배경 프리뷰: 선택한 프리뷰 ID가 있으면 그것을, 없으면 장착된 ID를 전달 */}
        <ClassProgressBar
          targetMinutes={1}
          showSubImages={false}
          previewBackgroundId={previewBackgroundId ?? equippedBackgroundId}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toggleWrapper: { position: 'absolute', top: 40, left: 40, flexDirection: 'row', gap: 12, zIndex: 10 },
  topBtn: { backgroundColor: '#E6DCC7', paddingHorizontal: 32, paddingVertical: 10, borderRadius: 14, borderWidth: 2, borderColor: '#D6C29A', minWidth: 100, alignItems: 'center' },
  topBtnInactive: { backgroundColor: '#FFFFFF' },
  topBtnText: { fontWeight: '600', fontSize: 14 },
  panel: { marginTop: 100, marginHorizontal: PANEL_MARGIN, paddingBottom: 24, backgroundColor: '#FFFBF2', borderRadius: 26, borderWidth: 3, borderColor: '#D6C29A', overflow: 'hidden' },
  headerBox: { height: 60, backgroundColor: '#E8DCC3', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  carouselWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 25 },
  scrollViewContainer: { width: CARD_WIDTH * VISIBLE_ITEMS + GAP * (VISIBLE_ITEMS - 1), overflow: 'hidden' },
  scrollContent: { paddingVertical: 6 },
  arrowBtn: { width: 45, alignItems: 'center' },
  arrowText: { fontSize: 24, color: '#D6C29A', fontWeight: 'bold' },
  card: { width: CARD_WIDTH, height: CARD_WIDTH + 45, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', borderWidth: 2, borderColor: '#DDD', marginRight: GAP, overflow: 'hidden' },
  selectedCard: { borderWidth: 4, borderColor: '#FFD86B' },
  imageWrapper: { width: '100%', height: '75%', justifyContent: 'center', alignItems: 'center' },
  charImage: { width: '80%', height: '80%' },
  bgFullImage: { width: '100%', height: '100%' },
  silhouetteImage: { tintColor: '#BDBDBD', opacity: 0.9 },
  cardText: { marginTop: 6, fontSize: 30, fontWeight: '700', color: '#3c2c19', textAlign: 'center' },
  selectedText: { color: '#C9A227' },
  lockOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  lockText: { fontSize: 28 },
  previewArea: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  previewImage: { width: 130, height: 130, marginBottom: 12 },
});