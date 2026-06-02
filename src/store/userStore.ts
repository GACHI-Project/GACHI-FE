import { create } from 'zustand';

interface UserState {
  name: string;
  setName: (name: string) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  name: '',
  setName: (name) => set({ name }),
  reset: () => set({ name: '' }),
}));
