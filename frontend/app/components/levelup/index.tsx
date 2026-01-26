import { View, Text, StyleSheet, Pressable, Modal, Image, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

export default function levelup(){

return(
<View>
<LottieView
    source={require('../../../assets/animations/levelup.json')}
    autoPlay
    loop={true}/>
</View>);
}

