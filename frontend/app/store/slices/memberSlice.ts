import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// 학생 목록 관리용

interface StudentMember {
  studentId: number;
  studentName: string;
  studentNumber: number;
  deviceUuid: string | null;
  currentXp?: number;
  currentLevel?: number;
}

interface MemberState {
  students: StudentMember[]; 
  loading: boolean;      
}

const initialState: MemberState = {
  students: [],
  loading: false,
};

const memberSlice = createSlice({
  name: 'member',
  initialState,
  reducers: {
    setStudents: (state, action: PayloadAction<StudentMember[]>) => {
      state.students = action.payload;
    },
    addStudent: (state, action: PayloadAction<StudentMember>) => {
      state.students.push(action.payload);
    },
    updateStudentInfo: (state, action: PayloadAction<StudentMember>) => {
      const index = state.students.findIndex(s => s.studentId === action.payload.studentId);
      if (index !== -1) {
        state.students[index] = action.payload;
      }
    },
    removeStudent: (state, action: PayloadAction<number>) => {
      state.students = state.students.filter(s => s.studentId !== action.payload);
    }
  },
});

export const { setStudents, addStudent, updateStudentInfo, removeStudent } = memberSlice.actions;
export default memberSlice.reducer;