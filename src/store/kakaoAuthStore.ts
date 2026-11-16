import { create } from 'zustand';

interface KakaoAuthState {
  rememberMe: boolean;
  setRememberMe: (v: boolean) => void;
  reset: () => void;
}

export const useKakaoAuthStore = create<KakaoAuthState>((set) => ({
  rememberMe: false,
  setRememberMe: (v) => set({ rememberMe: v }),
  reset: () => set({ rememberMe: false }),
}));
