export type StudentStatus = 'participating' | 'left';

export interface Student {
  id: string;
  number: number;
  name: string;
  avatar: string;
  time: string; // "00:00" 형태
  status: StudentStatus;
  warningCount: number;
}