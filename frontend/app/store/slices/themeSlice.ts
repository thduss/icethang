import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';

/* ================= 공통 타입 ================= */
export type ThemeCategory = 'CHARACTER' | 'BACKGROUND';

export interface ThemeItem {
  id: number;
  name: string;
  category: ThemeCategory;
  unlocked: boolean;
  equipped: boolean;
}

/* ================= 기본 캐릭터 ID ================= */
// 🔥 DB 기준 기본 캐릭터 (기차)
const DEFAULT_CHARACTER_ID = 5;

/* ================= 상태 ================= */
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

/* ================= 전체 캐릭터 조회 ================= */
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

/* ================= 전체 배경 조회 ================= */
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

/* ================= 테마 장착 ================= */
export const equipTheme = createAsyncThunk<
  { id: number; category: ThemeCategory },
  { id: number; category: ThemeCategory }
>('theme/equipTheme', async ({ id, category }) => {
  const type = category === 'CHARACTER' ? 'characters' : 'backgrounds';
  await api.patch(`/themes/${type}/${id}/equip`);
  return { id, category };
});

/* ================= slice ================= */
const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      /* ---------- 전체 캐릭터 ---------- */
      .addCase(fetchAllCharacters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCharacters.fulfilled, (state, action) => {
        state.loading = false;

        // 1️⃣ 기본 캐릭터는 항상 unlocked
        const characters = action.payload.map(c => ({
          ...c,
          unlocked:
            c.id === DEFAULT_CHARACTER_ID ? true : c.unlocked,
        }));

        // 2️⃣ 서버에서 equipped 내려오면 그걸 우선
        let equipped = characters.find(c => c.equipped);

        // 3️⃣ 없으면 기본 캐릭터를 강제 장착
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

      /* ---------- 전체 배경 ---------- */
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

      /* ---------- 장착 ---------- */
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
