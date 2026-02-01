import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';

/* ================= 타입 ================= */
export type ThemeCategory = 'CHARACTER' | 'BACKGROUND';

export type ThemeItem = {
  id: number;
  name: string;
  assetUrl: string;
  category: ThemeCategory;
  unlocked: boolean;
  equipped: boolean;
};

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
    id: item.id,
    name: item.name,
    assetUrl: item.assetUrl,
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
    id: item.id,
    name: item.name,
    assetUrl: item.assetUrl,
    category: 'BACKGROUND' as const,
    unlocked: Boolean(item.isOwned),
    equipped: Boolean(item.isEquipped),
  }));
});

/* ================= 장착 ================= */
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

        // 1️⃣ 캐릭터 목록 세팅
        state.allCharacters = action.payload.map((item, index) => ({
          ...item,
          // 🔥 첫 번째 캐릭터는 기본 무료 캐릭터
          unlocked: index === 0 ? true : item.unlocked,
        }));

        // 2️⃣ 서버에서 장착된 캐릭터가 있는지 확인
        const equipped = state.allCharacters.find(c => c.equipped);

        if (equipped) {
          // 서버 기준 장착 캐릭터 사용
          state.equippedCharacterId = equipped.id;
        } else if (state.allCharacters.length > 0) {
          // 🔥 아무도 장착 안 돼 있으면 기본 캐릭터 강제 장착
          state.allCharacters[0].equipped = true;
          state.equippedCharacterId = state.allCharacters[0].id;
        }
      })
      .addCase(fetchAllCharacters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? '캐릭터 조회 실패';
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
        state.error = action.error.message ?? '배경 조회 실패';
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
