import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';

export type ThemeCategory = 'CHARACTER' | 'BACKGROUND';

export interface ThemeItem {
  id: number;
  name: string;
  category: ThemeCategory;
  unlocked: boolean;
  equipped: boolean;
  assetUrl: string;
}

const DEFAULT_CHARACTER_ASSET_URL = 5;
const DEFAULT_BACKGROUND_ASSET_URL = 1;

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

export const fetchAllCharacters = createAsyncThunk<ThemeItem[], number>(
  'theme/fetchAllCharacters',
  async (studentId) => {
    const res = await api.get('/themes/characters', { params: { studentId } });
    return res.data.map((item: any) => {
      const themeId = item.themeId || Number(item.assetUrl);
      const assetUrl = item.assetUrl ? String(item.assetUrl) : String(themeId || 5);
      
      return {
        id: themeId,
        name: item.name,
        category: 'CHARACTER' as const,
        unlocked: assetUrl === '5' ? true : Boolean(item.unlocked || item.isOwned),
        equipped: Boolean(item.isEquipped || item.equipped),
        assetUrl: assetUrl,
      };
    });
  }
);

export const fetchAllBackgrounds = createAsyncThunk<ThemeItem[]>(
  'theme/fetchAllBackgrounds',
  async () => {
    const res = await api.get('/themes/backgrounds');
    return res.data.map((item: any) => ({
      id: item.themeId || Number(item.assetUrl),
      name: item.name,
      category: 'BACKGROUND' as const,
      unlocked: Boolean(item.unlocked || item.isOwned),
      equipped: Boolean(item.equipped || item.isEquipped),
      assetUrl: item.assetUrl ? String(item.assetUrl) : String(item.themeId || 1),
    }));
  }
);

export const equipTheme = createAsyncThunk<
  { id: number; category: ThemeCategory },
  { id: number; category: ThemeCategory; studentId: number }
>('theme/equipTheme', async ({ id, category, studentId }) => {
  const type = category === 'CHARACTER' ? 'characters' : 'backgrounds';
  
  await api.patch(
    `/themes/${type}/${id}/equip`,
    null,
    {
      params: { studentId },
    }
  );

  return { id, category };
});

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setEquippedTheme: (state, action: { payload: { id: number; category: ThemeCategory } }) => {
      const { id, category } = action.payload;
      if (category === 'CHARACTER') {
        state.equippedCharacterId = id;
        state.allCharacters.forEach(c => c.equipped = Number(c.assetUrl) === id);
      } else {
        state.equippedBackgroundId = id;
        state.allBackgrounds.forEach(b => b.equipped = Number(b.assetUrl) === id);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCharacters.fulfilled, (state, action) => {
        state.allCharacters = action.payload;

        const equipped = action.payload.find((c) => c.equipped);
        
        if (equipped && equipped.assetUrl) {
          state.equippedCharacterId = Number(equipped.assetUrl);
          console.log(`✅ [서버 응답] 장착된 캐릭터 ID: ${state.equippedCharacterId}`);
        } else {
          const firstUnlocked = action.payload.find(c => c.unlocked);
          
          if (firstUnlocked) {
            state.equippedCharacterId = Number(firstUnlocked.assetUrl);
            firstUnlocked.equipped = true;
            console.log(`⚠️ [자동 설정] 첫 번째 unlocked 캐릭터 ID: ${state.equippedCharacterId}`);
          } else {
            state.equippedCharacterId = DEFAULT_CHARACTER_ASSET_URL;
            const defaultChar = action.payload.find(c => Number(c.assetUrl) === DEFAULT_CHARACTER_ASSET_URL);
            if (defaultChar) {
              defaultChar.equipped = true;
              defaultChar.unlocked = true; 
            }
            console.log(`⚠️ [기본값 설정] 기본 캐릭터 ID: ${state.equippedCharacterId}`);
          }
        }
        state.loading = false;
      })
      .addCase(fetchAllCharacters.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllCharacters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '캐릭터 로딩 실패';
      })
      .addCase(fetchAllBackgrounds.fulfilled, (state, action) => {
        state.allBackgrounds = action.payload;
        const equipped = action.payload.find((b) => b.equipped);
        if (equipped && equipped.assetUrl) {
          state.equippedBackgroundId = Number(equipped.assetUrl);
        } else {
          state.equippedBackgroundId = DEFAULT_BACKGROUND_ASSET_URL;
          const defaultBg = action.payload.find(b => Number(b.assetUrl) === DEFAULT_BACKGROUND_ASSET_URL);
          if (defaultBg) {
            defaultBg.equipped = true;
          }
        }
        state.loading = false;
      })
      .addCase(fetchAllBackgrounds.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllBackgrounds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '배경 로딩 실패';
      })

      .addCase(equipTheme.pending, (state, action) => {
        const { id, category } = action.meta.arg;
        
        console.log(`🚀 [선조치] ${category} ID: ${id} 장착 반영 시작`);

        if (category === 'CHARACTER') {
          state.equippedCharacterId = id;
          state.allCharacters.forEach(c => {
            c.equipped = Number(c.assetUrl) === id;
          });
        } else {
          state.equippedBackgroundId = id;
          state.allBackgrounds.forEach(b => {
            b.equipped = Number(b.assetUrl) === id;
          });
        }
      })
      
      .addCase(equipTheme.fulfilled, (state, action) => {
        const { id, category } = action.payload;
        console.log(`✅ [서버 확인] ${category} ID: ${id} 장착 완료`);
        
        if (category === 'CHARACTER') {
          state.equippedCharacterId = id;
          state.allCharacters.forEach(c => {
            c.equipped = Number(c.assetUrl) === id;
          });
        } else {
          state.equippedBackgroundId = id;
          state.allBackgrounds.forEach(b => {
            b.equipped = Number(b.assetUrl) === id;
          });
        }
      })
      

      .addCase(equipTheme.rejected, (state, action) => {
        console.error("❌ 장착 실패 (서버 에러):", action.error);
        state.error = action.error.message || '장착 실패';
        
        const { category } = action.meta.arg;
        
        if (category === 'CHARACTER') {
          const previousEquipped = state.allCharacters.find(c => c.equipped);
          if (previousEquipped) {
            state.equippedCharacterId = Number(previousEquipped.assetUrl);
          }
        } else {
          const previousEquipped = state.allBackgrounds.find(b => b.equipped);
          if (previousEquipped) {
            state.equippedBackgroundId = Number(previousEquipped.assetUrl);
          }
        }
      });
  },
});

export const { setEquippedTheme } = themeSlice.actions;
export default themeSlice.reducer;