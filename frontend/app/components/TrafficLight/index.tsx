import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

const TrafficLight = () => {
  const [signal, setSignal] = useState('red');

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <View style={[
          styles.light, 
          { backgroundColor: signal === 'red' ? '#FF3B30' : '#444' }
        ]} />
        
        <View style={[
          styles.light, 
          { backgroundColor: signal === 'yellow' ? '#FFCC00' : '#444', elevation: 20 }
        ]} />
        <View style={[
          styles.light, 
          { backgroundColor: signal === 'green' ? '#00eb27' : '#444' }
        ]} />
      </View>

      {/* 테스트용 버튼  이거 나중에 카메라로 정보 받으면 state 변환하고 버튼 삭제 예정*/}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => {
          if (signal === 'red') setSignal('green');
          else if (signal === 'green') setSignal('yellow');
          else setSignal('red');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    bottom: '25%',
    right: 20,
    alignItems: 'center',
  },
  body: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 20,
    gap: 10, 
  },
  light: {
    width: 60,
    height: 60,
    borderRadius: 30, 
    borderWidth: 2,
    borderColor: '#111',
  },
  button: {
    marginTop: 20,
    width: 100,
    height: 40,
    backgroundColor: '#ddd',
    borderRadius: 5,
  }
});

export default TrafficLight;