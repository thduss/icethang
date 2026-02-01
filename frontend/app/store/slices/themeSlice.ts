import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';

export const fetchAllThemes = createAsyncThunk(
  'theme/fetchAllThemes',
  async (studentId: number, { rejectWithValue }) => {
    try {
      const [resMyBg, resMyChar] = await Promise.all([
        api.get('/themes/backgrounds/my', {
          params: { studentId },
        }),
        api.get('/themes/characters/my', {
          params: { studentId },
        }),
      ]);

      return {
        myBackgrounds: resMyBg.data,
        myCharacters: resMyChar.data,
      };
    } catch (e: any) {
      return rejectWithValue(e.response?.data || e.message);
    }
  }
);



export const equipTheme = createAsyncThunk(
  'theme/equipTheme',
  async (
    { id, category }: { id: number; category: 'CHARACTER' | 'BACKGROUND' },
    { rejectWithValue }
  ) => {
    try {
      const type = category === 'BACKGROUND' ? 'backgrounds' : 'characters';
      await api.patch(`/themes/${type}/${id}/equip`);
      return { id, category };
    } catch (e: any) {
      return rejectWithValue(e.response?.data || e.message);
    }
  }
);

interface ThemeItem {
  id: number;
  name: string;
  assetUrl: string;
  category: 'CHARACTER' | 'BACKGROUND';
  equipped: boolean;
  unlocked: boolean;
}

interface ThemeState {
  myCharacters: ThemeItem[];
  myBackgrounds: ThemeItem[];
  equippedCharacterId: number | null;
  equippedBackgroundId: number | null;
  loading: boolean;
}

const initialState: ThemeState = {
  myCharacters: [],
  myBackgrounds: [],
  equippedCharacterId: null,
  equippedBackgroundId: null,
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
        const { myBackgrounds, myCharacters } = action.payload as {
          myBackgrounds: ThemeItem[];
          myCharacters: ThemeItem[];
        }

        state.myBackgrounds = myBackgrounds;
        state.myCharacters = myCharacters;
        
        const equippedBg = myBackgrounds.find(item => item.equipped);
        const equippedChar = myCharacters.find(item => item.equipped);

        state.equippedBackgroundId = equippedBg?.id ?? null;
        state.equippedCharacterId = equippedChar?.id ?? null;

        state.loading = false;
      })
      .addCase(fetchAllThemes.rejected, (state) => {
        state.loading = false;
      })

      // 테마 장착
      .addCase(equipTheme.fulfilled, (state, action) => {
        const { id, category } = action.payload;
        
        if (category === 'CHARACTER') {
          state.equippedCharacterId = id;
          state.myCharacters.forEach(item => {
            item.equipped = item.id === id;
          });
        } else {
          state.equippedBackgroundId = id;
          state.myBackgrounds.forEach(item => {
            item.equipped = item.id === id;
          });
        }
      });
  },
});

export const { setEquippedCharacter, setEquippedBackground } = themeSlice.actions;
export default themeSlice.reducer;