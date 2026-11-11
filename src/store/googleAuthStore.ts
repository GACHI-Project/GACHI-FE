import { create } from 'zustand';

interface GoogleAuthState {
  rememberMe: boolean;
  setRememberMe: (v: boolean) => void;
}

export const useGoogleAuthStore = create<GoogleAuthState>((set) => ({
  rememberMe: false,
  setRememberMe: (v) => set({ rememberMe: v }),
}));
