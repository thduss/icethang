import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';

export type ThemeCategory = 'CHARACTER' | 'BACKGROUND';

export interface ThemeItem {
  id: number;
  name: string;
  category: ThemeCategory;
  unlocked: boolean;
  equipped: boolean;
}


const DEFAULT_CHARACTER_ID = 5;

interface ThemeState {
  allCharacters: ThemeItem[];
  allBackgrounds: ThemeItem[];
  equippedCharacterId: number | null;
  equippedBackgroundId: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: ThemeState = {
  allCharacters: [],
  allBackgrounds: [],
  equippedCharacterId: null,
  equippedBackgroundId: null,
  loading: false,
  error: null,
};

export const fetchAllCharacters = createAsyncThunk<
  ThemeItem[],
  number
>('theme/fetchAllCharacters', async (studentId) => {
  const res = await api.get('/themes/characters', {
    params: { studentId },
  });

  return res.data.map((item: any) => ({
    id: item.themeId,
    name: item.name,
    category: 'CHARACTER' as const,
    unlocked: Boolean(item.isOwned),
    equipped: Boolean(item.isEquipped),
  }));
});

export const fetchAllBackgrounds = createAsyncThunk<
  ThemeItem[]
>('theme/fetchAllBackgrounds', async () => {
  const res = await api.get('/themes/backgrounds');

  return res.data.map((item: any) => ({
    id: item.themeId,
    name: item.name,
    category: 'BACKGROUND' as const,
    unlocked: Boolean(item.unlocked),
    equipped: Boolean(item.equipped),
  }));
});

export const equipTheme = createAsyncThunk<
  { id: number; category: ThemeCategory },
  { id: number; category: ThemeCategory }
>('theme/equipTheme', async ({ id, category }) => {
  const type = category === 'CHARACTER' ? 'characters' : 'backgrounds';
  await api.patch(`/themes/${type}/${id}/equip`);
  return { id, category };
});

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      /* 전체 캐릭터 */
      .addCase(fetchAllCharacters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCharacters.fulfilled, (state, action) => {
        state.loading = false;

        const characters = action.payload.map(c => ({
          ...c,
          unlocked:
            c.id === DEFAULT_CHARACTER_ID ? true : c.unlocked,
        }));

        let equipped = characters.find(c => c.equipped);

        if (!equipped) {
          characters.forEach(c => {
            c.equipped = c.id === DEFAULT_CHARACTER_ID;
          });
          equipped = characters.find(
            c => c.id === DEFAULT_CHARACTER_ID
          );
        }

        state.allCharacters = characters;
        state.equippedCharacterId =
          equipped?.id ?? DEFAULT_CHARACTER_ID;
      })
      .addCase(fetchAllCharacters.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message ?? '캐릭터 조회 실패';
      })

      /* 전체 배경 */
      .addCase(fetchAllBackgrounds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllBackgrounds.fulfilled, (state, action) => {
        state.loading = false;
        state.allBackgrounds = action.payload;

        const equipped = action.payload.find(b => b.equipped);
        state.equippedBackgroundId = equipped?.id ?? null;
      })
      .addCase(fetchAllBackgrounds.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message ?? '배경 조회 실패';
      })

      /* 장착 */
      .addCase(equipTheme.fulfilled, (state, action) => {
        const { id, category } = action.payload;

        if (category === 'CHARACTER') {
          state.equippedCharacterId = id;
          state.allCharacters.forEach(c => {
            c.equipped = c.id === id;
          });
        } else {
          state.equippedBackgroundId = id;
          state.allBackgrounds.forEach(b => {
            b.equipped = b.id === id;
          });
        }
      });
  },
});

export default themeSlice.reducer;
