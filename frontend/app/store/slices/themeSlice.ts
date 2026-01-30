import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';

export const fetchAllThemes = createAsyncThunk('theme/fetchAllThemes', async () => {

  const [resAllBg, resAllChar, resMyBg, resMyChar] = await Promise.all([
    api.get(`/themes/backgrounds`),     
    api.get(`/themes/characters`),       
    api.get(`/themes/backgrounds/my`),
    api.get(`/themes/characters/my`)   
  ]);

  return {
    allBackgrounds: resAllBg.data,
    allCharacters: resAllChar.data,
    myBackgrounds: resMyBg.data,
    myCharacters: resMyChar.data,
  };
});


export const equipTheme = createAsyncThunk(
  'theme/equipTheme',
  async ({ id, category }: { id: number; category: 'CHARACTER' | 'BACKGROUND' }) => {
    const type = category === 'BACKGROUND' ? 'backgrounds' : 'characters';
    
    await api.patch(`/themes/${type}/${id}/equip`);
    
    return { id, category };
  }
);

interface ThemeState {
  unlockedThemeIds: number[];    
  equippedCharacterId: number | null; 
  equippedBackgroundId: number | null;
  loading: boolean;
}

const initialState: ThemeState = { 
  unlockedThemeIds: [1, 2, 3, 4], 
  equippedBackgroundId: 1,        
  equippedCharacterId: 5,        
  loading: false,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setEquippedCharacter: (state, action: PayloadAction<number>) => {
      state.equippedCharacterId = action.payload;
    },
    setEquippedBackground: (state, action: PayloadAction<number>) => {
      state.equippedBackgroundId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllThemes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllThemes.fulfilled, (state, action) => {
        const { myBackgrounds, myCharacters } = action.payload;

        const myBgIds = myBackgrounds.map((item: any) => item.id);
        const myCharIds = myCharacters.map((item: any) => item.id);
        state.unlockedThemeIds = [...myBgIds, ...myCharIds];

        const equippedBg = myBackgrounds.find((item: any) => item.is_equipped);
        const equippedChar = myCharacters.find((item: any) => item.is_equipped);

        if (equippedBg) state.equippedBackgroundId = equippedBg.id;
        if (equippedChar) state.equippedCharacterId = equippedChar.id;
        
        state.loading = false;
      })
      .addCase(equipTheme.fulfilled, (state, action) => {
        const { id, category } = action.payload;
        if (category === 'BACKGROUND') {
          state.equippedBackgroundId = id;
        } else {
          state.equippedCharacterId = id;
        }
      });
  },
});

export const { setEquippedCharacter, setEquippedBackground } = themeSlice.actions;
export default themeSlice.reducer;