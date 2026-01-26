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
}

const initialState: ThemeState = {
  allThemes: [],
  unlockedThemeIds: [],
};

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
    }
  }
});

export const { setAllThemes, setUnlockedThemes, unlockNewTheme } = themeSlice.actions;
export default themeSlice.reducer;