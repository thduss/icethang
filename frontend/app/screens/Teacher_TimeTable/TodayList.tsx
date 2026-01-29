import React from "react";
import { View, Text, StyleSheet } from 'react-native';

export interface TodaySubject {
    period: number;
    subject: string;
}

interface TodayListProps {
    data: TodaySubject[];
}

const TodayList = ({data}: TodayListProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>오늘의 시간표</Text>
            </View>

            <View style={styles.listContainer}>
                {data.length === 0 ? (
                    <View style={{ alignItems: 'center', marginTop: 20 }}>
                        <Text style={{ color: '#aaa' }}>수업이 없는 날입니다.</Text>
                    </View>
                ) : (
                    data.map((item, index) => (
                        <View key={`${item.period}-${index}`} style={[
                            styles.row,
                            index === data.length - 1 && { borderBottomWidth: 0 }
                        ]}>
                            <View style={styles.periodBox}>
                                <Text style={styles.periodText}>{item.period}교시</Text>
                            </View>
                            <View style={styles.subjectBox}>
                                <Text style={styles.subjectText}>{item.subject}</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </View>
    );
};

export default TodayList;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDFBF8',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#E0D6C8',
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        backgroundColor: '#4E342E',
        paddingVertical: 15,
        alignItems: 'center',
    },
    headerText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    listContainer: {
        padding: 15,
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#D7C8B6',
        paddingVertical: 12,
    },
    periodBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#D7C8B6',
        backgroundColor: '#EFE9E1',
        borderRadius: 5,
        marginRight: 10,
        paddingVertical: 5,
    },
    periodText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#5D4037',
    },
    subjectBox: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subjectText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3E2723',
    },
});