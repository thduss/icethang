import NaverLogin from '@react-native-seoul/naver-login';

export const initNaverLogin = () => {
  NaverLogin.initialize({
    appName: 'ice-thang',
    consumerKey: process.env.EXPO_PUBLIC_NAVER_CLIENT_ID || '',    
    consumerSecret: process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET || '', 
    serviceUrlSchemeIOS: 'ice-thang',
    disableNaverAppAuthIOS: true,
  });
};