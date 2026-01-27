export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

export interface TimeTableItem {
  period: number;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  [key: string]: string | number; 
}

export const timeTableData: TimeTableItem[] = [
  { period: 1, mon: '국어', tue: '영어', wed: '수학', thu: '사회', fri: '국어' },
  { period: 2, mon: '수학', tue: '사회', wed: '과학', thu: '영어', fri: '수학' },
  { period: 3, mon: '영어', tue: '수학', wed: '국어', thu: '과학', fri: '영어' },
  { period: 4, mon: '과학', tue: '국어', wed: '미술', thu: '수학', fri: '사회' },
  { period: 5, mon: '사회', tue: '음악', wed: '영어', thu: '국어', fri: '과학' },
  { period: 6, mon: '체육', tue: '창체', wed: '실과', thu: '체육', fri: '음악' },
];

export const getTodaySchedule = (data: TimeTableItem[], dayKey: DayKey) => {
  return data.map(item => ({
    period: item.period,
    subject: item[dayKey] as string
  }));
};