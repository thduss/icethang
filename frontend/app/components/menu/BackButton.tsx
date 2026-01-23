import { StyleSheet, Pressable, Image } from 'react-native'
import { router } from 'expo-router'

interface BackButtonProps {
  onPress?: () => void
  size?: number
}


const BackButton = ({ onPress, size = 40 }: BackButtonProps) => {
  const handlePress = () => {
    if (onPress) {
      onPress()
    } else {
      router.back()
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      style={styles.container}
    >
      <Image
        source={require('../../../assets/backButton.svg')}
        style={{
          width: size,
          height: size,
          transform: [{ rotate: '180deg' }]
        }}
        resizeMode="contain"
      />
    </Pressable>
  )
}

export default BackButton

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
})