import React, {useState, useEffect} from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { TimeTableItem, DayKey } from './dummyData';

interface WeeklyGridProps {
    data: TimeTableItem[];
    onSave: (newData: TimeTableItem[]) => void;
}

const WeeklyGrid = ({ data, onSave }: WeeklyGridProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempData, setTempData] = useState<TimeTableItem[]>(data);

    useEffect(() => {
        setTempData(data);
    }, [data]);

    const handleChange = (text: string, rowIndex: number, key: DayKey) => {
        const newData = [...tempData];
        newData[rowIndex] = { ...newData[rowIndex], [key]: text };
        setTempData(newData);
    };

    const handleSave = () => {
        onSave(tempData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTempData(data);
        setIsEditing(false);
    };

    const dayKeys: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
    
    return (
        <View style={styles.container}>
            <View style={styles.topHeader}>
                <Text style={styles.headerTitle}>전체 시간표</Text>

                <View style={styles.buttonGroup}>
                    {isEditing ? (
                        <>
                        <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave}>
                            <Text style={styles.btnText}>저장</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={handleCancel}>
                            <Text style={styles.btnText}>취소</Text>
                        </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity style={[styles.btn, styles.editBtn]} onPress={() => setIsEditing(true)}>
                        <Text style={styles.btnText}>수정</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.table}>
                <View style={styles.headerRow}>
                    <Text style={[styles.cell, styles.headerCell]}>요일</Text>
                    <Text style={[styles.cell, styles.headerCell]}>월</Text>
                    <Text style={[styles.cell, styles.headerCell]}>화</Text>
                    <Text style={[styles.cell, styles.headerCell]}>수</Text>
                    <Text style={[styles.cell, styles.headerCell]}>목</Text>
                    <Text style={[styles.cell, styles.headerCell]}>금</Text>
                </View>

                {tempData.map((row, rowIndex) => (
                    <View key={row.period} style={styles.row}>
                        {/* 1교시, 2교시... (수정 불가) */}
                        <Text style={[styles.cell, styles.periodCell]}>{row.period}교시</Text>

                        {/* 과목 데이터 (수정 가능) */}
                        {dayKeys.map((day) => (
                        <View key={day} style={styles.inputCellContainer}>
                            {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={String(row[day])}
                                onChangeText={(text) => handleChange(text, rowIndex, day)}
                                textAlign="center"
                            />
                            ) : (
                            <Text style={styles.cellText}>{row[day]}</Text>
                            )}
                        </View>
                        ))}
                    </View>
                ))}
            </View>
        </View>
    );
};


export default WeeklyGrid;

const styles = StyleSheet.create({
    container: {
        flex: 2,
        backgroundColor: '#FDFBF8',
        borderRadius: 20,
        padding: 20,
        marginRight: 20,
        borderWidth: 2,
        borderColor: '#E0D6C8',
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        position: 'relative',
        height: 30,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#3E2723',
    },
    buttonGroup: {
        position: 'absolute',
        right: 0,
        flexDirection: 'row',
        gap: 8,
    },
    btn: {
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 15,
    },
    editBtn: { backgroundColor: '#7986CB' },
    saveBtn: { backgroundColor: '#7FA864' },
    cancelBtn: { backgroundColor: '#D7C8B6' },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    

    table: {
        borderWidth: 2,
        borderColor: '#5D4037',
        borderRadius: 10,
        overflow: 'hidden',
    },
    headerRow: {
        flexDirection: 'row',
        backgroundColor: '#EFE9E1',
        borderBottomWidth: 1,
        borderBottomColor: '#5D4037',
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#5D4037',
        backgroundColor: '#FFF',
        alignItems: 'center',
        height: 50,
    },
    cell: {
        flex: 1,
        textAlign: 'center',
        paddingVertical: 15,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3E2723',
        borderRightWidth: 1,
        borderRightColor: '#5D4037',
    },
    inputCellContainer: {
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: '#5D4037',
        justifyContent: 'center',
        height: '100%',
    },
    cellText: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3E2723',
    },
    input: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3E2723',
        backgroundColor: '#FAFAF5',
        padding: 0,
    },
    headerCell: {
        backgroundColor: '#EFE9E1',
        fontSize: 18,
    },
    periodCell: {
        backgroundColor: '#F5F5F5',
        fontSize: 16,
        borderRightWidth: 1,
        borderRightColor: '#5D4037',
    },
});