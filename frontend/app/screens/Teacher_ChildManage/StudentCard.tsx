import { StyleSheet, Text, View, Image, Pressable } from 'react-native'

interface StudentCardProps {
  name: string
  number: number
  onPress?: () => void
}

const StudentCard = ({ name, number, onPress }: StudentCardProps) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image
        source={require('../../../assets/Teacher_ChildManage.png')}
        style={styles.image}
        resizeMode="contain"
      />
      <View style={styles.titleWrapper}>
        <Text style={styles.text}>
          {number}번 {name}
        </Text>
      </View>
    </Pressable>
  )
}

export default StudentCard

const styles = StyleSheet.create({

  card: {
    width: '100%',
    aspectRatio: 0.82,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  image: {
    width: '65%',
    height: '55%',
    marginBottom: 12,
  },

  text: {
    fontSize: 16,
    fontWeight: '600',
  },

  titleWrapper: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f0e3ba',
    borderRadius: 30,
  },
})
