import React, { useEffect } from 'react';
import { StyleSheet, View, StatusBar, LayoutAnimation, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router'; 
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/stores';
import * as SecureStore from 'expo-secure-store';

import { Header } from './Header';
import { NotificationBanner } from './NotificationBanner';
import { StudentList } from './StudentList';

import { stompClient, connectSocket, disconnectSocket, changeClassMode } from '../../utils/socket';
import { 
  updateStudentAlert, 
  setClientClassMode, 
  joinStudent, 
  Student 
} from '../../store/slices/lessonSlice';
import { endClassSession } from '../../api/lesson';

const TeacherLessonScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useLocalSearchParams();
  
  const classIdParam = params.classId ? Number(params.classId) : 0;
  const classId = classIdParam === 0 ? 1 : classIdParam; 
  const className = params.className ? String(params.className) : "1학년 1반";

  const { participantCount, alertList, studentList, classMode, startTime } = useSelector((state: RootState) => state.lesson);
  const token = useSelector((state: RootState) => state.auth?.token);

  useEffect(() => {
    const initLesson = async () => {
      if (!classId) return;

      let activeToken = token;
      if (!activeToken) {
        activeToken = await SecureStore.getItemAsync('accessToken');
      }

      if (activeToken) {
        console.log("🚀 [수업 대기] 선생님 접속 완료. 학생 입장을 기다립니다...");

        // 실시간 소켓 연결
        if (!stompClient.connected) {
          connectSocket(activeToken);
        }

        stompClient.onConnect = () => {
          console.log(`✅ [반 ${classId}] 실시간 소켓 구독 시작`);

          // 통합 알림 구독 (입장, 딴짓, 이탈)
          stompClient.subscribe(`/topic/class/${classId}`, (msg) => {
            const body = JSON.parse(msg.body);
            console.log('📦 소켓 수신:', body.type, body);

            // 입장 (ENTER) -> 리스트에 추가
            if (body.type === 'ENTER') {
              console.log(`👋 학생 입장 확인: ${body.studentName}`);
              dispatch(joinStudent(body));
            } 
            // 상태 변경 (UNFOCUS, AWAY, FOCUS)
            else if (['FOCUS', 'UNFOCUS', 'AWAY'].includes(body.type)) {
              dispatch(updateStudentAlert(body));
            }
          });

          // 모드 동기화
          stompClient.subscribe(`/topic/class/${classId}/mode`, (msg) => {
             const body = JSON.parse(msg.body);
             dispatch(setClientClassMode(body.mode));
          });
        };
      }
    };

    initLesson();

    // 나갈 때 소켓 끊기
    return () => { disconnectSocket(); };
  }, [classId, token, dispatch]);


  const handleToggleMode = () => {
    const nextMode = classMode === 'NORMAL' ? 'DIGITAL' : 'NORMAL';
    changeClassMode(classId, nextMode);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    dispatch(setClientClassMode(nextMode));
  };

  // 수업 종료 핸들러
  const handleEndClass = async () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const endTimeStr = now.toLocaleTimeString('en-GB', { hour12: false });

    const reportData = {
      date: dateStr,
      startTime: startTime || "09:00:00",
      endTime: endTimeStr,
      subject: "수학",
      classNo: 1
    };

    

    const success = await endClassSession(classId, reportData);
    
    if (success) {
      if (stompClient && stompClient.connected) {
        stompClient.publish({
          destination: `/pub/class/${classId}/finish`, 
          body: JSON.stringify({
            type: 'CLASS_FINISHED',
            classId: classId,
          }),
        });
      }
      console.log("✅ 수업 종료 신호 전송 완료");
      router.back(); 
    } else {
      Alert.alert("알림", "리포트 저장 실패.");
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F2EBE3" />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        
        <Header 
          classId={classId}
          className={className} 
          participantCount={participantCount} 
          currentMode={classMode}       
          onToggleMode={handleToggleMode}
          onEndClass={handleEndClass} 
        />

        <View style={styles.bannerWrapper}>
           <NotificationBanner leftStudents={alertList} />
        </View>

        <View style={styles.listWrapper}>
          <StudentList data={studentList} />
        </View>

      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3EED4' },
  bannerWrapper: { paddingHorizontal: 16, marginBottom: 8 },
  listWrapper: { flex: 1, paddingHorizontal: 16 },
});

export default TeacherLessonScreen;