import { create } from 'zustand';
import { ChildPayload } from '../api/child';
import { ServerNotificationPreference } from '../types/notification';

interface RegisterState {
  loginId: string;
  password: string;
  name: string;
  email: string;
  phoneNumber: string;
  languageCode: string;
  notificationPreference: ServerNotificationPreference;
  children: ChildPayload[];
  signupDone: boolean;
  loginDone: boolean;
  registeredChildrenCount: number;
  agreedToTerms: boolean;
  setBasicInfo: (info: {
    loginId: string;
    password: string;
    name: string;
    email: string;
    phoneNumber: string;
  }) => void;
  setLanguageCode: (v: string) => void;
  setNotificationPreference: (v: ServerNotificationPreference) => void;
  setChildren: (v: ChildPayload[]) => void;
  setSignupDone: (v: boolean) => void;
  setLoginDone: (v: boolean) => void;
  incrementRegisteredChildrenCount: () => void;
  setAgreedToTerms: (v: boolean) => void;
  reset: () => void;
}

const initialState = {
  loginId: '',
  password: '',
  name: '',
  email: '',
  phoneNumber: '',
  languageCode: 'KO',
  notificationPreference: 'IMPORTANT' as ServerNotificationPreference,
  children: [],
  signupDone: false,
  loginDone: false,
  registeredChildrenCount: 0,
  agreedToTerms: false,
};

export const useRegisterStore = create<RegisterState>((set) => ({
  ...initialState,
  setBasicInfo: (info) =>
    set((state) => {
      const changed =
        state.loginId !== info.loginId ||
        state.password !== info.password ||
        state.name !== info.name ||
        state.email !== info.email ||
        state.phoneNumber !== info.phoneNumber;
      return {
        ...info,
        ...(changed ? { signupDone: false, loginDone: false } : {}),
      };
    }),
  setLanguageCode: (v) => set({ languageCode: v }),
  setNotificationPreference: (v) => set({ notificationPreference: v }),
  setChildren: (v) => set({ children: v, registeredChildrenCount: 0 }),
  setSignupDone: (v) => set({ signupDone: v }),
  setLoginDone: (v) => set({ loginDone: v }),
  incrementRegisteredChildrenCount: () =>
    set((state) => ({ registeredChildrenCount: state.registeredChildrenCount + 1 })),
  setAgreedToTerms: (v) => set({ agreedToTerms: v }),
  reset: () => set(initialState),
}));
