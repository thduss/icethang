const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('tflite');
config.resolver.blockList = [
  /node_modules\/react-native-fast-tflite\/android\/src\/main\/cpp\/lib\/.*/,
];

module.exports = withNativeWind(config, { input: './global.css' });