import { create } from 'zustand';

export type KakaoAuthMode = 'login' | 'link';

interface KakaoAuthState {
  rememberMe: boolean;
  setRememberMe: (v: boolean) => void;
  mode: KakaoAuthMode;
  setMode: (v: KakaoAuthMode) => void;
  reset: () => void;
}

export const useKakaoAuthStore = create<KakaoAuthState>((set) => ({
  rememberMe: false,
  setRememberMe: (v) => set({ rememberMe: v }),
  mode: 'login',
  setMode: (v) => set({ mode: v }),
  reset: () => set({ rememberMe: false, mode: 'login' }),
}));
