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
  ActivityIndicator,
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

  const themeState = useSelector((state: RootState) => state.theme);
  const allCharacters = themeState.allCharacters || [];
  const allBackgrounds = themeState.allBackgrounds || [];
  const loading = themeState.loading;
  
  const equippedCharacterId = themeState.equippedCharacterId;
  const equippedBackgroundId = themeState.equippedBackgroundId;

  const studentId = useSelector(
    (state: RootState) => state.auth.studentData?.studentId
  );

  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    console.log('📊 [상태 확인]', {
      activeTab,
      equippedCharacterId,
      equippedBackgroundId,
      charactersCount: allCharacters.length,
      backgroundsCount: allBackgrounds.length,
      loading,
      initialLoadComplete,
    });
  }, [activeTab, equippedCharacterId, equippedBackgroundId, allCharacters, allBackgrounds, loading, initialLoadComplete]);

  useEffect(() => {
    if (!studentId) return;
    
    const loadData = async () => {
      if (activeTab === 'character' && allCharacters.length === 0) {
        await dispatch(fetchAllCharacters(studentId));
        setInitialLoadComplete(true);
      } else if (activeTab === 'theme' && allBackgrounds.length === 0) {
        await dispatch(fetchAllBackgrounds());
        setInitialLoadComplete(true);
      }
    };
    
    loadData();
  }, [dispatch, studentId, activeTab]);

  useEffect(() => {
    if (activeTab === 'character') {
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
    setOffsets((prev) => ({ ...prev, [tab]: x }));
  };

  const moveScroll = (tab: TabType, direction: 'left' | 'right') => {
    const current = offsets[tab];
    let next = direction === 'left' ? current - PAGE_WIDTH : current + PAGE_WIDTH;
    next = Math.max(0, Math.min(next, maxOffset));

    scrollRefs[tab].current?.scrollTo({ x: next, animated: true });
    setOffsets((prev) => ({ ...prev, [tab]: next }));
  };

  const getImageSource = (item: ThemeItem, isSelected: boolean, isLocked: boolean) => {
    const targetId = Number(item.assetUrl);
    const localItem = itemData[targetId];

    if (!localItem) {
      console.warn(`⚠️ itemData에 ID ${targetId}가 없습니다.`);
      return null;
    }
    
    if (isLocked) return localItem.imageInactive;
  
    if (item.category === 'BACKGROUND') {
      return localItem.imageInactive;
    }
    
    return isSelected ? localItem.imageActive : localItem.imageInactive;
  };

  const handleSelect = async (item: ThemeItem) => {
    if (!studentId) {
      console.error('❌ studentId가 없습니다.');
      return;
    }

    const targetId = Number(item.assetUrl);
    const currentEquippedId = item.category === 'CHARACTER' ? equippedCharacterId : equippedBackgroundId;
    
    console.log(`👆 [클릭] ${item.category} 선택! ID: ${targetId}, 현재 장착된 ID: ${currentEquippedId}`);

    if (currentEquippedId === targetId) {
      console.log('ℹ️ 이미 장착된 아이템입니다. 서버 요청 스킵.');
      return;
    }

    try {
      if (item.category === 'BACKGROUND') {
        setPreviewBackgroundId(targetId);
      }

      await dispatch(
        equipTheme({
          id: targetId,
          category: item.category,
          studentId,
        })
      ).unwrap();

      console.log(`✅ [완료] ${item.category} ID: ${targetId} 장착 완료`);
    } catch (e: any) {
      console.error('❌ 장착 실패 - 상세 정보:', {
        message: e?.message,
        status: e?.response?.status,
        data: e?.response?.data,
        category: item.category,
        targetId,
      });
      
      if (item.category === 'BACKGROUND') {
        setPreviewBackgroundId(equippedBackgroundId);
      }
    }
  };

  if (loading || currentItems.length === 0) {
    return (
      <ImageBackground source={background} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C9A227" />
          <Text style={styles.loadingText}>테마 로딩 중...</Text>
        </View>
      </ImageBackground>
    );
  }

  const previewCharacter = equippedCharacterId !== null 
    ? allCharacters.find((c) => Number(c.assetUrl) === equippedCharacterId)
    : null;
  const previewItem = previewCharacter ? itemData[Number(previewCharacter.assetUrl)] : null;

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
                const targetId = Number(item.assetUrl);       
                const currentEquippedId = item.category === 'CHARACTER' 
                  ? equippedCharacterId 
                  : equippedBackgroundId;

                const isSelected = currentEquippedId !== null && currentEquippedId === targetId;
                const isLocked = !item.unlocked;

                if (index === 0) {
                  console.log(`🎯 [렌더링/탭:${activeTab}] 장착ID=${currentEquippedId}, 첫카드ID=${targetId}, 선택됨=${isSelected}`);
                }

                return (
                  <Pressable
                    key={`${item.category}-${targetId}-${index}`}
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
        {activeTab === 'character' && previewItem && (
          <Image
            source={previewItem.imageActive}
            style={styles.previewImage}
            resizeMode="contain"
          />
        )}
        <ClassProgressBar
          targetMinutes={1}
          showSubImages={false}
          previewBackgroundId={previewBackgroundId}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#3c2c19',
  },

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
  },

  scrollViewContainer: {
    width: CARD_WIDTH * VISIBLE_ITEMS + GAP * (VISIBLE_ITEMS - 1),
    overflow: 'hidden',
  },

  scrollContent: { paddingVertical: 6 },

  arrowBtn: { width: 45, alignItems: 'center' },
  arrowText: {
    fontSize: 24,
    color: '#D6C29A',
    fontWeight: 'bold',
  },

  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH + 45,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DDD',
    marginRight: GAP,
    overflow: 'hidden',
  },

  selectedCard: {
    borderWidth: 4,
    borderColor: '#FFD86B',
  },

  imageWrapper: {
    width: '100%',
    height: '75%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  charImage: { width: '80%', height: '80%' },
  bgFullImage: { width: '100%', height: '100%' },

  silhouetteImage: {
    tintColor: '#BDBDBD',
    opacity: 0.9,
  },

  cardText: {
    marginTop: 6,
    fontSize: 30,
    fontWeight: '700',
    color: '#3c2c19',
    textAlign: 'center',
  },

  selectedText: { color: '#C9A227' },

  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  lockText: { fontSize: 28 },

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