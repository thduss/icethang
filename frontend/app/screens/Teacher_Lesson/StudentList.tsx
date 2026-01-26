import React from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { Student } from './types';

interface StudentListProps {
  data: Student[];
}

export const StudentList = ({ data }: StudentListProps) => {

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Text style={[styles.headerText, { flex: 0.8 }]}>번호</Text>
      <Text style={[styles.headerText, { flex: 2, textAlign: 'left', paddingLeft: 20 }]}>이름</Text>
      <Text style={[styles.headerText, { flex: 1.5 }]}>참여 시간</Text>
      <Text style={[styles.headerText, { flex: 1.5 }]}>상태</Text>
      <Text style={[styles.headerText, { flex: 1 }]}>누적 횟수</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Student }) => {
    const isLeft = item.status === 'left';
    const rowBackgroundColor = isLeft ? '#FFF5F5' : 'transparent';
    const statusColor = isLeft ? '#D32F2F' : '#7FA864';
    const statusText = isLeft ? '이탈' : '참여중';
    const statusIcon = isLeft ? '⚠️' : '✅';

    return (
      // [수정] TouchableOpacity -> View 변경 (클릭 상호작용 제거)
      <View style={[styles.row, { backgroundColor: rowBackgroundColor }]}>
        <Text style={[styles.cellText, { flex: 0.8, fontWeight: 'bold' }]}>{item.number}</Text>
        
        <View style={[styles.nameContainer, { flex: 2 }]}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <Text style={styles.nameText}>{item.name}</Text>
        </View>

        <Text style={[styles.cellText, { flex: 1.5 }]}>{item.time}</Text>

        <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
           <Text style={{ marginRight: 4, fontSize: 12 }}>{statusIcon}</Text>
           <Text style={{ color: statusColor, fontWeight: 'bold', fontSize: 14 }}>{statusText}</Text>
        </View>

        <Text style={[styles.cellText, { flex: 1 }]}>{item.warningCount}</Text>
      </View>
    );
  };

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

// 스타일은 이전과 동일
const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    backgroundColor: '#FDFBF8', 
    borderRadius: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E0D6C8',
    overflow: 'hidden', 
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#EFE9E1',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D7C8B6',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 13,
    color: '#8D7B68',
    fontWeight: '600',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0E6DA',
  },
  cellText: {
    fontSize: 15,
    color: '#5D4037',
    textAlign: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: '#ddd',
  },
  nameText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4A3B32',
  },
});