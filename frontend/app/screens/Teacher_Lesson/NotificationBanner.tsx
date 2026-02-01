import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { Student } from '../../store/slices/lessonSlice';

interface NotificationBannerProps {
  leftStudents: Student[];
}

export const NotificationBanner = ({ leftStudents }: NotificationBannerProps) => {
  if (leftStudents.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      {/* 다람쥐 캐릭터 */}
      <View style={styles.characterContainer}>
        <Image 
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/235/235359.png' }} 
          style={styles.characterImage}
          resizeMode="contain"
        />
      </View>

      {/* 메세지 박스 */}
      <View style={styles.messageBackground}>
        <View style={styles.dashedBorder}>
          <ScrollView 
            style={styles.scrollArea}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            {leftStudents.map((student, index) => {
              // 상태에 따라 메시지와 아이콘 변경
              const isLeft = student.status === 'left';
              const message = isLeft ? '수업에서 이탈했습니다.' : '딴짓 중입니다!';
              const icon = isLeft ? '🏃' : '👀';

              return (
                <View key={student.id} style={[
                  styles.alertRow, 
                  index === leftStudents.length - 1 && { borderBottomWidth: 0 } 
                ]}>
                  <Text style={styles.warningIcon}>{icon}</Text>
                  <Text style={styles.messageText}>
                    <Text style={styles.highlightText}>{student.name} 학생</Text>
                    이 {message}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 20,
    marginHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    height: 100,
  },
  characterContainer: {
    zIndex: 2,
    marginRight: -25,
    elevation: 4, 
    alignItems: 'center',
  },
  characterImage: {
    width: 75,
    height: 75,
  },
  messageBackground: {
    flex: 1,
    height: '100%', 
    backgroundColor: '#FDFBF8',
    borderRadius: 15,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  dashedBorder: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#D7C8B6',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingLeft: 30,
    paddingRight: 10,
    paddingVertical: 5,
  },

  scrollArea: {
    flex: 1,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  
  warningIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  messageText: {
    fontSize: 14,
    color: '#5D4037',
    fontWeight: '500',
  },
  highlightText: {
    fontWeight: 'bold',
    color: '#D32F2F',
    fontSize: 15,
  }
});