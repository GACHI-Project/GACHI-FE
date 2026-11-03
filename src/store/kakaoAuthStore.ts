import { create } from 'zustand';

interface KakaoAuthState {
  rememberMe: boolean;
  setRememberMe: (v: boolean) => void;
}

export const useKakaoAuthStore = create<KakaoAuthState>((set) => ({
  rememberMe: false,
  setRememberMe: (v) => set({ rememberMe: v }),
}));
