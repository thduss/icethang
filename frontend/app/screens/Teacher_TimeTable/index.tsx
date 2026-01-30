import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';

import LeftSidebar from "../../components/Menu/LeftSidebar";
import BackButton from "../../components/Menu/BackButton";
import WeeklyGrid, { GridRow } from "./WeeklyGrid";
import TodayList, { TodaySubject } from "./TodayList";

import { AppDispatch, RootState } from '../../store/stores';
import { fetchSchedules, modifySchedule, addSchedule } from '../../store/slices/scheduleSlice';
import { ScheduleDto } from '../../services/scheduleService';

const TeacherTimeTable = () => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    const { items: scheduleData, loading } = useSelector((state: RootState) => state.schedule);
    const selectedClassId = useSelector((state: RootState) => state.class.selectedClassId);

    // API 호출 (반이 선택되면 자동 실행)
    useEffect(() => {
        if (selectedClassId) {
            const targetDate = "20251029"; 
            
            console.log(`🧪 테스트 요청 시작: 반ID=${selectedClassId}, 날짜=${targetDate}`);

            dispatch(fetchSchedules({ 
                groupId: selectedClassId, 
                targetDate: targetDate 
            }));
        }
    }, [selectedClassId]);

    const weeklyGridData: GridRow[] = useMemo(() => {
        const grid: GridRow[] = Array.from({ length: 6 }, (_, i) => ({
            period: i + 1,
            mon: '', tue: '', wed: '', thu: '', fri: ''
        }));

        if (!scheduleData || scheduleData.length === 0) return grid;

        scheduleData.forEach((item: ScheduleDto) => {
            const rowIndex = item.classNo - 1;
            if (rowIndex >= 0 && rowIndex < 6) {
                const dayKey = item.dayOfWeek.toLowerCase() as keyof GridRow;
                if (dayKey !== 'period' && grid[rowIndex][dayKey] !== undefined) {
                    grid[rowIndex][dayKey] = item.subject;
                }
            }
        });

        return grid;
    }, [scheduleData]);

    const todayListData: TodaySubject[] = useMemo(() => {
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const todayStr = days[new Date().getDay()];

        return scheduleData
            .filter(item => item.dayOfWeek === todayStr)
            .sort((a, b) => a.classNo - b.classNo)
            .map(item => ({
                period: item.classNo,
                subject: item.subject
            }));
    }, [scheduleData]);

    // 저장 핸들러 (Todo : 현재는 기능 없음, 추후 POST 연결)
    const handleUpdateSchedule = async (newGrid: GridRow[]) => {
        if (!selectedClassId) return;
        console.log('📝 변경 사항 감지 중...');

        const days = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;
        const currentSem = scheduleData.length > 0 ? scheduleData[0].sem : 1;

        for (const row of newGrid) {
            const period = row.period;

            for (const day of days) {
                const newSubject = row[day];

                const targetDayUpper = day.toUpperCase();
                const originalItem = scheduleData.find(
                    item => item.classNo === period && item.dayOfWeek === targetDayUpper
                );

                if (originalItem) {
                    if (originalItem.subject !== newSubject) {
                        console.log(`🔄 수정 발견! ${day.toUpperCase()} ${period}교시: ${originalItem.subject} -> ${newSubject}`);

                        dispatch(modifySchedule({
                            groupId: selectedClassId,
                            timetableId: originalItem.timetableId,
                            data: { subject: newSubject }
                        }));
                    }
                }
                else if (newSubject !== "") {
                    console.log(`➕ 추가: ${targetDayUpper} ${period}교시 - ${newSubject}`);
                    
                    dispatch(addSchedule({
                        groupId: selectedClassId,
                        data: {
                            dayOfWeek: targetDayUpper,
                            classNo: period,
                            subject: newSubject,
                            sem: currentSem
                        }
                    }));
                }
            }
        }
    };

    return (
        <View style={styles.container}>
            <LeftSidebar />

            <SafeAreaView style={styles.content} edges={['top', 'right', 'bottom']}>
                <View style={styles.header}>
                    <View style={styles.backButtonWrapper}>
                        <BackButton onPress={() => router.back()} />
                    </View>

                    <Text style={styles.pageTitle}>시간표</Text>
                    <View style={{ width: 80 }} />
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4E342E" />
                        <Text>시간표를 불러오는 중...</Text>
                    </View>
                ) : (
                    <View style={styles.timeTableArea}>
                        <WeeklyGrid data={weeklyGridData} onSave={handleUpdateSchedule} />
                        <TodayList data={todayListData} />
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
};

export default TeacherTimeTable;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#F3EED4',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButtonWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 100,
    },
    pageTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000',
    },
    timeTableArea: {
        flex: 1,
        flexDirection: 'row',
        gap: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});