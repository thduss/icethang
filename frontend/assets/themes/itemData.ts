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
];

export default itemData;