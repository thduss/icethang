import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { Student } from '../../store/slices/lessonSlice';

interface NotificationBannerProps {
  leftStudents: Student[];
}

export const NotificationBanner = ({ leftStudents }: NotificationBannerProps) => {
  
  // 학생이 없으면 숨김
  if (leftStudents.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      
      <View style={styles.characterContainer}>
        <Image 
          source={require('../../../assets/Teacher_Notification.png')} 
          style={styles.characterImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.messageBackground}>
        <View style={styles.dashedBorder}>
          <ScrollView 
            style={styles.scrollArea}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            {leftStudents.map((student) => {
              const isLeft = student.status === 'left';
              const message = isLeft ? '수업에서 이탈했습니다.' : '딴짓 중입니다!';
              const icon = isLeft ? '🏃' : '👀';

              return (
                <View key={student.id} style={styles.messageRow}>
                  <Text style={styles.messageText}>
                    <Text style={styles.boldText}>{icon} {student.name}</Text>
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
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  characterImage: {
    width: 90,
    height: 90,
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
    padding: 10,
    justifyContent: 'center',
  },
  
  scrollArea: {
    flex: 1,
  },
  messageRow: {
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#5D4037',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#8D7B68',
  },
});