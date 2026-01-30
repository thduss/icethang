interface Item {
id: number;
  name: string; 
  imageActive: any;  
  imageInactive: any;
  category: 'CHARACTER' | 'BACKGROUND';
}
const itemData: Item[] = [
  // 배경의 경우 Inactive 붙은게 선택창에 있는 이미지 active 붙은건 밑에 깔리는 이미지
  { id: 1, name: '도시', imageActive: require('./city.jpg'), imageInactive: require('./city.jpg'), category: 'BACKGROUND' },
  { id: 2, name: '숲길', imageActive: require('./background1.png'), imageInactive: require('./jungle.jpg'), category: 'BACKGROUND' },
  { id: 3, name: '우주', imageActive: require('./universe.jpg'), imageInactive: require('./universe.jpg'), category: 'BACKGROUND' },
  { id: 4, name: '바다', imageActive: require('./sea.jpg'), imageInactive: require('./sea.jpg'), category: 'BACKGROUND' },
  { id: 5, name: '기차', imageActive: require('../characters/1.png'), imageInactive: require('./city.jpg'), category: 'CHARACTER' },
  { id: 6, name: '오토바이', imageActive: require('../characters/2.png'), imageInactive: require('./city.jpg'), category: 'CHARACTER' },
  { id: 7, name: '트럭', imageActive: require('../characters/3.png'), imageInactive: require('./city.jpg'), category: 'CHARACTER' },
  { id: 8, name: '배', imageActive: require('../characters/4.png'), imageInactive: require('./city.jpg'), category: 'CHARACTER' },
  { id: 9, name: '자동차', imageActive: require('../characters/5.png'), imageInactive: require('./city.jpg'), category: 'CHARACTER' },
  { id: 10, name: '버스', imageActive: require('../characters/6.png'), imageInactive: require('./city.jpg'), category: 'CHARACTER' },
  { id: 11, name: '왕큰버스', imageActive: require('../characters/7.png'), imageInactive: require('./city.jpg'), category: 'CHARACTER' },
  { id: 12, name: '비행기', imageActive: require('../characters/8.png'), imageInactive: require('./city.jpg'), category: 'CHARACTER' },
  { id: 13, name: '여우', imageActive: require('../characters/1.png'), imageInactive: require('./city.jpg'), category: 'CHARACTER' },
  { id: 14, name: '곰', imageActive: require('../characters/1.png'), imageInactive: require('./city.jpg'), category:'CHARACTER' },
  { id :15, name : "개",imageActive :require("./city.jpg"),imageInactive :require("./city.jpg"),category :'CHARACTER'},
  { id: 16, name: '토끼', imageActive: require('./city.jpg'), imageInactive: require('./city.jpg'), category: 'CHARACTER' },
];

export default itemData;