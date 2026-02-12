import React from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { Student } from '../../store/slices/lessonSlice'; 

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
    const isUnfocus = item.status === 'unfocus';
    const isRestroom = item.status === 'restroom';
    const isActivity = item.status === 'activity';

    let rowBackgroundColor = 'transparent';
    if (isLeft) rowBackgroundColor = '#FFF5F5';
    else if (isUnfocus) rowBackgroundColor = '#FFFDE7';
    else if (isRestroom) rowBackgroundColor = '#E3F2FD';
    else if (isActivity) rowBackgroundColor = '#E8F5E9';

    let statusText = '참여중';
    let statusColor = '#7FA864';
    let statusIcon = '✅';
    let displayCount = item.warningCount;

    if (isLeft) {
      statusText = '이탈';
      statusColor = '#D32F2F';
      statusIcon = '🏃';
      displayCount = item.awayCount;
    } else if (isUnfocus) {
      statusText = '딴짓';
      statusColor = '#F57C00';
      statusIcon = '⚠️';
      displayCount = item.warningCount;
    } else if (isRestroom) {
      statusText = '화장실';
      statusColor = '#1976D2';
      statusIcon = '🚽';
      displayCount = item.warningCount;
    } else if (isActivity) {
      statusText = '발표중';
      statusColor = '#388E3C';
      statusIcon = '✋';
      displayCount = item.warningCount;
    }

    return (
      <View style={[styles.row, { backgroundColor: rowBackgroundColor }]}>
        {/* 번호 */}
        <Text style={[styles.cellText, { flex: 0.8, fontWeight: 'bold' }]}>
            {item.studentNumber} 
        </Text>
        
        {/* 이름 & 아바타 */}
        <View style={[styles.nameContainer, { flex: 2 }]}>
          <Image 
            source={require('../../../assets/Teacher_ChildManage.png')} 
            style={styles.avatar} 
          />
          
          <Text style={styles.nameText}>{item.name}</Text>
        </View>

        {/* 참여 시간 */}
        <Text style={[styles.cellText, { flex: 1.5 }]}>{item.time}</Text>

        {/* 상태 아이콘 & 텍스트 */}
        <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
           <Text style={{ marginRight: 4, fontSize: 12 }}>{statusIcon}</Text>
           <Text style={{ color: statusColor, fontWeight: 'bold', fontSize: 14 }}>{statusText}</Text>
        </View>

        {/* 누적 횟수 (상태에 따라 이탈횟수 or 딴짓횟수) */}
        <Text style={[styles.cellText, { flex: 1 }]}>{displayCount}회</Text>
      </View>
    );
  };

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()} 
        ListHeaderComponent={renderHeader}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

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

  },
  nameText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4A3B32',
  },
});