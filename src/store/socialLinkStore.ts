import { create } from 'zustand';

export interface PendingLink {
  provider: 'kakao' | 'google';
  linkToken: string;
  rememberMe: boolean;
  email?: string;
}

interface SocialLinkState {
  pendingLink: PendingLink | null;
  setPendingLink: (v: PendingLink | null) => void;
  clearPendingLink: () => void;
  reset: () => void;
}

export const useSocialLinkStore = create<SocialLinkState>((set) => ({
  pendingLink: null,
  setPendingLink: (v) => set({ pendingLink: v }),
  clearPendingLink: () => set({ pendingLink: null }),
  reset: () => set({ pendingLink: null }),
}));
