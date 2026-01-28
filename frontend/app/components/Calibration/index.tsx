import { Modal, View, Text, StyleSheet, Image } from 'react-native'
import { useEffect, useState } from 'react'

interface CalibrationModalProps {
  visible: boolean
  onFinish: () => void
}

const CalibrationModal = ({ visible, onFinish }: CalibrationModalProps) => {

  const [count, setCount] = useState(3)

  useEffect(() => {
    if (!visible) return

    setCount(3)

    const interval = setInterval(() => {
      setCount(prev => prev - 1)
    }, 1000)

    const timeout = setTimeout(() => {
      onFinish()
    }, 3000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [visible])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >

      <View style={styles.overlay}>

        <Image
          source={require('../../../assets/calibration2.png')}
          style={styles.frame}
          resizeMode="contain"
        />

        <View style={styles.content}>

          <Text style={styles.text}>
            3초간 다람쥐를 바라보세요!
          </Text>

          <Image
            source={require('../../../assets/calibration1.png')}
            style={styles.squirrel}
            resizeMode="contain"
          />

          {count >= 0 && (
            <Text style={styles.count}>
              {count}
            </Text>
          )}

        </View>
      </View>
    </Modal>
  )
}

export default CalibrationModal

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  frame: {
    position: 'absolute',
    width: '90%',
    height: '70%',
  },

  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  squirrel: {
    width: 240,
    height: 240,
    marginTop: 20,  
    marginRight: -20,
  },

  text: {
    fontSize: 40,
    fontWeight: '700',
    color: '#3B6EA5',
    marginTop: 10,
  },

  count: {
    marginTop: 12,
    fontSize: 64,
    fontWeight: '900',
    color: '#3B6EA5',
  },
})
