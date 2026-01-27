import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Dimensions, 
  Image, 
  ImageSourcePropType 
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

// 1. 데이터 타입 정의
interface GridItem {
  id: number;
  name: string;
  themeKey?:'jungle' | 'universe' | 'city' | 'sea' ; // 테마 키 옵션 추가
  image?: ImageSourcePropType; // 이미지 속성 추가
}

const { width } = Dimensions.get('window');
const ITEMS_PER_PAGE = 4;
const ITEM_WIDTH = (width - 100) / ITEMS_PER_PAGE;

export default function ReusableGridScreen() {
  const { theme, setTheme } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'theme' | 'character'>('theme');
  const [currentPage, setCurrentPage] = useState(0);

  // 2. 테마 데이터 설정 (이미지 경로 포함)
  const themeData: GridItem[] = [
    { id: 1, name: '정글', themeKey: 'jungle', image: require('../../../assets/themes/jungle.jpg') },
    { id: 2, name: '우주', themeKey: 'universe', image: require('../../../assets/themes/universe.jpg') },
    { id: 3, name: '도시', themeKey: 'city', image: require('../../../assets/themes/city.jpg') },
    { id: 4, name: '바다', themeKey: 'sea', image: require('../../../assets/themes/sea.jpg') },
  ];

  const characterData: GridItem[] = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    name: `캐릭터 ${i + 1}`,
    // 캐릭터는 이미지가 없을 경우를 대비해 비워둠
  }));

  const currentData = activeTab === 'theme' ? themeData : characterData;
  const totalPages = Math.ceil(currentData.length / ITEMS_PER_PAGE);
  const displayedItems = currentData.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const handleSelect = (item: GridItem) => {
    if (activeTab === 'theme' && item.themeKey) {
      setTheme(item.themeKey);
    } else {
      console.log(`${item.name} 선택됨`);
    }
  };

  const handleTabChange = (tab: 'theme' | 'character') => {
    setActiveTab(tab);
    setCurrentPage(0);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
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
        <Pressable 
          onPress={() => setCurrentPage(p => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          style={currentPage === 0 && { opacity: 0.2 }}
        >
          <Text style={[styles.arrowText, { color: theme.primary }]}>◀</Text>
        </Pressable>

        <View className='pt-8' style={styles.itemsContainer}>
          {displayedItems.map((item) => (
            <Pressable 
              key={item.id} 
              style={[styles.gridButton, { backgroundColor: theme.card }]}
              onPress={() => handleSelect(item)}
            >
  
              {item.image ? (
                <Image 
                  source={item.image} 
                  style={styles.imageThumbnail} 
                  resizeMode="cover" 
                />
              ) : (
                <View style={[styles.iconPlaceholder, { backgroundColor: theme.primary }]} />
              )}
              <Text className='pt-6 font-yeogi text-2xl' style={[styles.gridButtonText, { color: theme.text }]} numberOfLines={1}>
                {item.name}
              </Text>
            </Pressable>
          ))}
          
          {displayedItems.length < ITEMS_PER_PAGE && 
            Array.from({ length: ITEMS_PER_PAGE - displayedItems.length }).map((_, i) => (
              <View key={`empty-${i}`} style={[styles.gridButton, { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 }]} />
            ))
          }
        </View>

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
    height: ITEM_WIDTH + 25, 
    marginHorizontal: 5,
    borderRadius: 12,
    justifyContent: 'flex-start', 
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  imageThumbnail: {
    width: '100%',
    height: '75%', 
    marginBottom: 4,
  },
  iconPlaceholder: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginTop: 10,
    marginBottom: 8 
  },
  gridButtonText: { 
    fontSize: 10, 
    fontWeight: '600', 
    textAlign: 'center',
    paddingHorizontal: 2
  },
  pageIndicator: { textAlign: 'center', marginTop: 30, fontSize: 13 }
});