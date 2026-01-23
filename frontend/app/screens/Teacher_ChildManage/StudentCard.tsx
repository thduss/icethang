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
    width: 180,
    height: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  image: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },

  text: {
    fontSize: 16,
    fontWeight: '600',
  },

  titleWrapper: {
    paddingHorizontal: 40,   
    paddingVertical: 8, 
    backgroundColor: '#f0e3ba', 
    borderRadius: 30,
  },
})
