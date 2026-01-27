import React, { useState } from "react";
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import LeftSidebar from "../../components/menu/LeftSidebar";
import BackButton from "app/components/menu/BackButton";
import WeeklyGrid from "./WeeklyGrid";
import TodayList from "./TodayList";
import { timeTableData, getTodaySchedule, TimeTableItem } from "./dummyData";

const TeacherTimeTable = () => {
    const router = useRouter();

    const [scheduleData, setScheduleData] = useState<TimeTableItem[]>(timeTableData);

    // 금요일 데이터로 임시 고정
    const todaySchedule = getTodaySchedule(scheduleData, 'fri');  

    const handleUpdateSchedule = (newData: TimeTableItem[]) => {
        console.log('시간표가 수정되었습니다.');
        setScheduleData(newData);
        // TODO: 여기서 백엔드 API로 수정된 데이터를 전송(PUT/POST)하면 됩니다.
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

                <View style={styles.timeTableArea}>
                    <WeeklyGrid data={timeTableData} onSave={handleUpdateSchedule} />
                    <TodayList data={todaySchedule} />
                </View>
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
    backText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3E2723',
        marginLeft: 5,
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
});