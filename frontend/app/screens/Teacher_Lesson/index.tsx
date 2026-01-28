import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Header } from './Header';
import { NotificationBanner } from './NotificationBanner';
import { StudentList } from './StudentList';
import { Student } from './types';

const App = () => {
  // [테스트용 데이터] 
  // 이탈 학생 4명, 전체 학생 10명
  const [students, setStudents] = useState<Student[]>([
    { id: '1', number: 1, name: '김도윤', avatar: 'https://cdn-icons-png.flaticon.com/512/3940/3940403.png', time: '00:24', status: 'participating', warningCount: 0 },
    { id: '2', number: 2, name: '박서준', avatar: 'https://cdn-icons-png.flaticon.com/512/3940/3940401.png', time: '00:12', status: 'left', warningCount: 1 }, // 이탈 1
    { id: '3', number: 3, name: '최지민', avatar: 'https://cdn-icons-png.flaticon.com/512/3940/3940404.png', time: '00:24', status: 'participating', warningCount: 0 },
    { id: '4', number: 4, name: '이민호', avatar: 'https://cdn-icons-png.flaticon.com/512/3940/3940400.png', time: '00:11', status: 'left', warningCount: 2 }, // 이탈 2
    { id: '5', number: 5, name: '정하윤', avatar: 'https://cdn-icons-png.flaticon.com/512/3940/3940405.png', time: '00:05', status: 'left', warningCount: 1 }, // 이탈 3
    { id: '6', number: 6, name: '강동원', avatar: 'https://cdn-icons-png.flaticon.com/512/3940/3940402.png', time: '00:02', status: 'left', warningCount: 3 }, // 이탈 4 (여기서부터 스크롤 생김)
    { id: '7', number: 7, name: '손흥민', avatar: 'https://cdn-icons-png.flaticon.com/512/3940/3940401.png', time: '00:24', status: 'participating', warningCount: 0 },
    { id: '8', number: 8, name: '김연아', avatar: 'https://cdn-icons-png.flaticon.com/512/3940/3940404.png', time: '00:24', status: 'participating', warningCount: 0 },
    { id: '9', number: 9, name: '아이유', avatar: 'https://cdn-icons-png.flaticon.com/512/3940/3940403.png', time: '00:24', status: 'participating', warningCount: 0 },
    { id: '10', number: 10, name: '유재석', avatar: 'https://cdn-icons-png.flaticon.com/512/3940/3940400.png', time: '00:24', status: 'participating', warningCount: 0 },
  ]);

  const leftStudents = students.filter(s => s.status === 'left');

  const handleEndClass = () => {
    console.log("수업 종료");
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F2EBE3" />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        
        <Header 
          className="1-3" 
          participantCount={students.filter(s => s.status === 'participating').length} 
          onEndClass={handleEndClass} 
        />

        {/* NotificationBanner에 이탈 학생 목록 전체 전달
          이탈자가 0명이면 내부에서 렌더링 안 함
        */}
        <View style={styles.bannerWrapper}>
           <NotificationBanner leftStudents={leftStudents} />
        </View>

        <View style={styles.contentArea}>
          <StudentList data={students} />
        </View>

      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2EBE3',
  },
  bannerWrapper: {
    marginTop: 10,
    zIndex: 1,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 20,
  }
});

export default App;