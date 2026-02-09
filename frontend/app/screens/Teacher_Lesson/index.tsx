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
  const token = useSelector((state: RootState) => state.auth?.accessToken);

  useEffect(() => {
    const initLesson = async () => {
      if (!classId) return;
      console.log('[Teacher] initLesson 시작 - classId:', classId);

      let activeToken = token;
      if (!activeToken) {
        activeToken = await SecureStore.getItemAsync('accessToken');
        console.log('[Teacher] SecureStore에서 토큰 조회:', activeToken ? '있음' : '없음');
      } else {
        console.log('[Teacher] Redux 토큰 사용');
      }

      if (activeToken) {
        console.log('[Teacher] 토큰 확인 완료. 소켓 상태 - connected:', stompClient.connected, 'active:', stompClient.active);

        const setupSubscriptions = () => {
          console.log(`[Teacher] 구독 설정 시작 - /topic/class/${classId}`);
          console.log('[Teacher] 소켓 상태 확인 - connected:', stompClient.connected, 'active:', stompClient.active);

          // 통합 알림 구독 (입장, 딴짓, 이탈)
          const classSub = stompClient.subscribe(`/topic/class/${classId}`, (msg) => {
            console.log('[Teacher] /topic/class/' + classId + ' 메시지 수신 RAW:', msg.body);
            try {
              const body = JSON.parse(msg.body);
              console.log('[Teacher] 파싱된 메시지 - type:', body.type, 'studentId:', body.studentId, 'studentName:', body.studentName);

              if (body.type === 'ENTER') {
                console.log('[Teacher] ENTER 처리 -> joinStudent dispatch');
                dispatch(joinStudent(body));
              } else if (['FOCUS', 'UNFOCUS', 'AWAY', 'RESTROOM', 'ACTIVITY'].includes(body.type)) {
                console.log('[Teacher] 상태 알림 처리 -> updateStudentAlert dispatch, type:', body.type);
                dispatch(updateStudentAlert(body));
              } else {
                console.log('[Teacher] 알 수 없는 type:', body.type);
              }
            } catch (e) {
              console.error('[Teacher] 메시지 파싱 에러:', e);
            }
          });
          console.log('[Teacher] /topic/class/' + classId + ' 구독 완료, subId:', classSub?.id);

          // 모드 동기화
          const modeSub = stompClient.subscribe(`/topic/class/${classId}/mode`, (msg) => {
            console.log('[Teacher] /topic/class/' + classId + '/mode 메시지 수신:', msg.body);
            const body = JSON.parse(msg.body);
            dispatch(setClientClassMode(body.mode));
          });
          console.log('[Teacher] /topic/class/' + classId + '/mode 구독 완료, subId:', modeSub?.id);
        };

        if (stompClient.connected) {
          console.log('[Teacher] 이미 연결됨 -> 즉시 구독');
          setupSubscriptions();
        } else {
          console.log('[Teacher] 미연결 -> connectSocket 호출 후 onConnect 대기');
          connectSocket(activeToken);
          stompClient.onConnect = () => {
            console.log('[Teacher] onConnect 콜백 실행됨!');
            setupSubscriptions();
          };
        }
      } else {
        console.warn('[Teacher] 토큰 없음! 소켓 연결 불가');
      }
    };

    initLesson();

    return () => {
      console.log('[Teacher] useEffect cleanup - disconnectSocket 호출');
      disconnectSocket();
    };
  }, [classId, token, dispatch]);


  const handleToggleMode = () => {
    const nextMode = classMode === 'NORMAL' ? 'DIGITAL' : 'NORMAL';
    console.log('[Teacher] 모드 변경 요청:', classMode, '->', nextMode);
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

    

    console.log('[Teacher] 수업 종료 API 호출 - classId:', classId, 'reportData:', JSON.stringify(reportData));
    const success = await endClassSession(classId, reportData);
    console.log('[Teacher] 수업 종료 API 결과:', success);

    if (success) {
      if (stompClient && stompClient.connected) {
        console.log('[Teacher] CLASS_FINISHED 발행 -> /topic/class/' + classId);
        stompClient.publish({
          destination: `/topic/class/${classId}`,
          body: JSON.stringify({
            type: 'CLASS_FINISHED',
            classId: classId,
          }),
        });
      } else {
        console.warn('[Teacher] CLASS_FINISHED 발행 실패 - 소켓 미연결');
      }
      console.log('[Teacher] 수업 종료 완료, 뒤로가기');
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