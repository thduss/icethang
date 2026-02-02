export interface LocalThemeItem {
  id: number;
  imageActive: any;
  imageInactive: any;
  category: 'CHARACTER' | 'BACKGROUND';
}


const itemData: Record<number, LocalThemeItem> = {
  // BACKGROUND 
  1: {
    id: 1,
    imageActive: require('./background1.png'),
    imageInactive: require('./city.jpg'),
    category: 'BACKGROUND',
  },
  2: {
    id: 2,
    imageActive: require('./background2.png'),
    imageInactive: require('./jungle.jpg'),
    category: 'BACKGROUND',
  },
  3: {
    id: 3,
    imageActive: require('./background3.png'),
    imageInactive: require('./universe.jpg'),
    category: 'BACKGROUND',
  },
  4: {
    id: 4,
    imageActive: require('./background4.png'),
    imageInactive: require('./sea.jpg'),
    category: 'BACKGROUND',
  },

  // CHARACTER
  5: {
    id: 5,
    imageActive: require('../characters/1.gif'),
    imageInactive: require('../characters/1.png'),
    category: 'CHARACTER',
  },
  6: {
    id: 6,
    imageActive: require('../characters/2.gif'),
    imageInactive: require('../characters/2.png'),
    category: 'CHARACTER',
  },
  7: {
    id: 7,
    imageActive: require('../characters/3.png'),
    imageInactive: require('../characters/3.png'),
    category: 'CHARACTER',
  },
  8: {
    id: 8,
    imageActive: require('../characters/4.png'),
    imageInactive: require('../characters/4.png'),
    category: 'CHARACTER',
  },
  9: {
    id: 9,
    imageActive: require('../characters/5.gif'),
    imageInactive: require('../characters/5.png'),
    category: 'CHARACTER',
  },
  10: {
    id: 10,
    imageActive: require('../characters/6.gif'),
    imageInactive: require('../characters/6.png'),
    category: 'CHARACTER',
  },
  11: {
    id: 11,
    imageActive: require('../characters/7.png'),
    imageInactive: require('../characters/7.png'),
    category: 'CHARACTER',
  },
  12: {
    id: 12,
    imageActive: require('../characters/8.png'),
    imageInactive: require('../characters/8.png'),
    category: 'CHARACTER',
  },
  13: {
    id: 13,
    imageActive: require('../characters/9.png'),
    imageInactive: require('../characters/9.png'),
    category: 'CHARACTER',
  },
  14: {
    id: 14,
    imageActive: require('../characters/10.png'),
    imageInactive: require('../characters/10.png'),
    category: 'CHARACTER',
  },
  15: {
    id: 15,
    imageActive: require('../characters/11.png'),
    imageInactive: require('../characters/11.png'),
    category: 'CHARACTER',
  },
  16: {
    id: 16,
    imageActive: require('../characters/12.png'),
    imageInactive: require('../characters/12.png'),
    category: 'CHARACTER',
  },
};

export default itemData;
