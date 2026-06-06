import { create } from 'zustand';
import { ChildItem } from '../api/child';

interface ChildrenStore {
  children: ChildItem[];
  setChildren: (children: ChildItem[]) => void;
}

export const useChildrenStore = create<ChildrenStore>((set) => ({
  children: [],
  setChildren: (children) => set({ children }),
}));
