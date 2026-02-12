import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 학생 데이터 타입
export interface Student {
  id: number;
  name: string;
  studentNumber: number;
  status: 'joined' | 'left' | 'unfocus' | 'restroom' | 'activity';
  avatar: string;
  warningCount: number;
  awayCount: number;
  time: string;
}

// 알림 엔트리 타입 (이벤트별 누적)
export interface AlertEntry {
  alertId: string;
  studentId: number;
  studentName: string;
  status: 'unfocus' | 'left' | 'restroom' | 'activity';
  alertTime: string;
}

// 소켓 데이터 타입
export interface SocketPayload {
  type: 'ENTER' | 'FOCUS' | 'UNFOCUS' | 'AWAY' | 'RESTROOM' | 'ACTIVITY';
  studentId: number;
  studentName: string;
  studentNumber?: number;   
  message?: string;
  alertTime?: string;
  totalAwayCount?: number;  
  totalUnfocusCount?: number; 
}

interface LessonState {
  participantCount: number;
  studentList: Student[];
  alertList: AlertEntry[];
  classMode: 'NORMAL' | 'DIGITAL';
  isLessonStarted: boolean;
  startTime: string | null;
}

const initialState: LessonState = {
  participantCount: 0,
  classMode: 'NORMAL',
  isLessonStarted: false,
  studentList: [], 
  alertList: [],
  startTime: null,
};

const lessonSlice = createSlice({
  name: 'lesson',
  initialState,
  reducers: {
    setInitialStudentList: (state, action: PayloadAction<Student[]>) => {
      state.studentList = action.payload;
      state.participantCount = action.payload.length;
    },

    updateParticipantCount: (state, action: PayloadAction<number>) => {
    },

    joinStudent: (state, action: PayloadAction<SocketPayload>) => {
      const { studentId, studentName, studentNumber } = action.payload;

      const exists = state.studentList.find(s => s.id === studentId);
      
      if (!exists) {
        const nowTime = new Date().toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        const newStudent: Student = {
          id: studentId,
          name: studentName,
          studentNumber: studentNumber || 99, 
          avatar: '', 
          status: 'joined',
          warningCount: 0,
          awayCount: 0,
          time: nowTime 
        };
        state.studentList.push(newStudent);
        state.participantCount = state.studentList.length;
      } else {
        exists.status = 'joined';
      }
    },

    updateStudentAlert: (state, action: PayloadAction<SocketPayload & { alertId?: string }>) => {
      const { studentId, type, totalAwayCount, totalUnfocusCount, alertId } = action.payload;
      const studentIndex = state.studentList.findIndex(s => s.id === studentId);

      if (studentIndex === -1) return;

      const student = state.studentList[studentIndex];

      if (type === 'FOCUS') {
        student.status = 'joined';
        return;
      }

      const nowTime = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

      if (type === 'UNFOCUS') {
        student.status = 'unfocus';
        if (totalUnfocusCount !== undefined) student.warningCount = totalUnfocusCount;
        else student.warningCount += 1;
      } else if (type === 'AWAY') {
        student.status = 'left';
        if (totalAwayCount !== undefined) student.awayCount = totalAwayCount;
        else student.awayCount += 1;
      } else if (type === 'RESTROOM') {
        student.status = 'restroom';
      } else if (type === 'ACTIVITY') {
        student.status = 'activity';
      }

      const statusMap: Record<string, AlertEntry['status']> = {
        'UNFOCUS': 'unfocus', 'AWAY': 'left', 'RESTROOM': 'restroom', 'ACTIVITY': 'activity'
      };

      state.alertList.push({
        alertId: alertId || `${studentId}-${Date.now()}`,
        studentId,
        studentName: student.name,
        status: statusMap[type],
        alertTime: nowTime,
      });
    },

    removeAlertById: (state, action: PayloadAction<string>) => {
      state.alertList = state.alertList.filter(a => a.alertId !== action.payload);
    },

    setClientClassMode: (state, action: PayloadAction<'NORMAL' | 'DIGITAL'>) => {
      state.classMode = action.payload;
    },

    startLesson: (state) => { 
      state.isLessonStarted = true;
      state.startTime = new Date().toLocaleTimeString('en-GB', { hour12: false }); 
    },

    endLesson: (state) => {
      state.isLessonStarted = false;
      state.alertList = [];
      state.studentList = []; 
      state.classMode = 'NORMAL';
      state.startTime = null; 
    }
  },
});

export const {
  setInitialStudentList,
  updateParticipantCount,
  updateStudentAlert,
  removeAlertById,
  joinStudent,
  setClientClassMode,
  startLesson,
  endLesson
} = lessonSlice.actions;

export default lessonSlice.reducer;