import { create } from 'zustand';
import type { ChildItem } from '../api/child';

interface ChildrenStore {
  children: ChildItem[];
  setChildren: (children: ChildItem[]) => void;
  reset: () => void;
}

export const useChildrenStore = create<ChildrenStore>((set) => ({
  children: [],
  setChildren: (children) => set({ children }),
  reset: () => set({ children: [] }),
}));
