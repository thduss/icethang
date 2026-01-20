import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext'; // Context 경로 확인 필요

// 데이터 타입 정의
interface GridItem {
  id: number;
  name: string;
  themeKey?: 'blue' | 'pink'; // 테마 키 추가
}

const { width } = Dimensions.get('window');
const ITEMS_PER_PAGE = 4;
const ITEM_WIDTH = (width - 100) / ITEMS_PER_PAGE;

export default function ReusableGridScreen() {
  const { theme, setTheme } = useAppTheme(); // 테마 상태 가져오기
  const [activeTab, setActiveTab] = useState<'theme' | 'character'>('theme');
  const [currentPage, setCurrentPage] = useState(0);

  // 1. 테마 데이터 설정 (themeKey를 실제 Context와 매칭)
  const themeData: GridItem[] = [
    { id: 1, name: '기본 블루', themeKey: 'blue' },
    { id: 2, name: '러블리 핑크', themeKey: 'pink' },
    { id: 3, name: '심플 블랙', themeKey: 'blue' }, // 추가 예시
    { id: 4, name: '스카이', themeKey: 'blue' },
  ];

  const characterData: GridItem[] = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    name: `캐릭터 ${i + 1}`,
  }));

  // 현재 데이터 및 페이지 계산
  const currentData = activeTab === 'theme' ? themeData : characterData;
  const totalPages = Math.ceil(currentData.length / ITEMS_PER_PAGE);
  const displayedItems = currentData.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  // 2. 클릭 시 동작 (테마 변경 적용)
  const handleSelect = (item: GridItem) => {
    if (activeTab === 'theme' && item.themeKey) {
      setTheme(item.themeKey); // 전역 테마 변경!
    } else {
      console.log(`${item.name} 선택됨`);
    }
  };

  const handleTabChange = (tab: 'theme' | 'character') => {
    setActiveTab(tab);
    setCurrentPage(0);
  };

  return (
    // 스타일을 theme 변수와 연동
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* 상단 탭 - 활성화된 테마 색상 적용 */}
      <View style={styles.tabContainer}>
        <Pressable 
          style={[styles.tab, activeTab === 'theme' && { borderBottomColor: theme.primary }]} 
          onPress={() => handleTabChange('theme')}
        >
          <Text style={[styles.tabText, activeTab === 'theme' && { color: theme.primary }]}>테마 변경</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'character' && { borderBottomColor: theme.primary }]} 
          onPress={() => handleTabChange('character')}
        >
          <Text style={[styles.tabText, activeTab === 'character' && { color: theme.primary }]}>캐릭터 선택</Text>
        </Pressable>
      </View>

      <View style={styles.gridWrapper}>
        {/* 왼쪽 화살표 */}
        <Pressable 
          onPress={() => setCurrentPage(p => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          style={currentPage === 0 && { opacity: 0.2 }}
        >
          <Text style={[styles.arrowText, { color: theme.primary }]}>◀</Text>
        </Pressable>

        {/* 아이템 4개 */}
        <View style={styles.itemsContainer}>
          {displayedItems.map((item) => (
            <Pressable 
              key={item.id} 
              style={[styles.gridButton, { backgroundColor: theme.card }]}
              onPress={() => handleSelect(item)}
            >
              <View style={[styles.iconPlaceholder, { backgroundColor: theme.primary }]} />
              <Text style={[styles.gridButtonText, { color: theme.text }]}>{item.name}</Text>
            </Pressable>
          ))}
          {/* 빈 공간 채우기 */}
          {displayedItems.length < ITEMS_PER_PAGE && 
            Array.from({ length: ITEMS_PER_PAGE - displayedItems.length }).map((_, i) => (
              <View key={`empty-${i}`} style={[styles.gridButton, { backgroundColor: 'transparent' }]} />
            ))
          }
        </View>

        {/* 오른쪽 화살표 */}
        <Pressable 
          onPress={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={currentPage >= totalPages - 1}
          style={currentPage >= totalPages - 1 && { opacity: 0.2 }}
        >
          <Text style={[styles.arrowText, { color: theme.primary }]}>▶</Text>
        </Pressable>
      </View>

      <Text style={[styles.pageIndicator, { color: theme.text, opacity: 0.5 }]}>
        {currentPage + 1} / {totalPages}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 80 },
  tabContainer: { flexDirection: 'row', marginBottom: 40, paddingHorizontal: 20 },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: '#333' },
  tabText: { color: '#888', fontSize: 16, fontWeight: 'bold' },
  gridWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  itemsContainer: { flexDirection: 'row', justifyContent: 'center', width: width - 100 },
  arrowText: { fontSize: 30, fontWeight: 'bold', padding: 10 },
  gridButton: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH + 15,
    marginHorizontal: 5,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    // 그림자 효과 (선택사항)
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  iconPlaceholder: { width: 40, height: 40, borderRadius: 20, marginBottom: 8 },
  gridButtonText: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  pageIndicator: { textAlign: 'center', marginTop: 30, fontSize: 13 }
});