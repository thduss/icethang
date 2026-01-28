import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Theme {
  theme_id: number;
  theme_name: string;
  asset_url: string;
  asset_type: string;
  theme_category: 'CHARACTER' | 'BACKGROUND';
}

interface ThemeState {
  allThemes: Theme[];
  unlockedThemeIds: number[]; // 내가 갖고있는거
  equippedCharacterId: number | null; 
  equippedBackgroundId: number | null;
}

const initialState: ThemeState = {
  allThemes: [],
  unlockedThemeIds: [1,2], 
  equippedBackgroundId: 1,
  equippedCharacterId: 10,           };

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setAllThemes: (state, action: PayloadAction<Theme[]>) => {
      state.allThemes = action.payload;
    },
    setUnlockedThemes: (state, action: PayloadAction<number[]>) => {
      state.unlockedThemeIds = action.payload;
    },
    unlockNewTheme: (state, action: PayloadAction<number>) => {
      state.unlockedThemeIds.push(action.payload);
    },
    setEquippedCharacter: (state, action: PayloadAction<number>) => {
      state.equippedCharacterId = action.payload;
    },
    setEquippedBackground: (state, action: PayloadAction<number>) => {
      state.equippedBackgroundId = action.payload;
    },
  }
});

export const { setAllThemes, setUnlockedThemes, unlockNewTheme, setEquippedCharacter, setEquippedBackground } = themeSlice.actions;
export default themeSlice.reducer;