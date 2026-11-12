import { create } from 'zustand';

interface NotificationStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decreaseUnreadCount: (readCount: number) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  decreaseUnreadCount: (readCount) =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - Math.max(0, readCount)) })),
}));
