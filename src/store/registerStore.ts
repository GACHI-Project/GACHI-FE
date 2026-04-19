import { create } from 'zustand';
import { ChildPayload } from '../api/child';

interface RegisterState {
  loginId: string;
  password: string;
  name: string;
  email: string;
  phoneNumber: string;
  children: ChildPayload[];
  signupDone: boolean;
  loginDone: boolean;
  registeredChildrenCount: number;
  setBasicInfo: (info: {
    loginId: string;
    password: string;
    name: string;
    email: string;
    phoneNumber: string;
  }) => void;
  setChildren: (v: ChildPayload[]) => void;
  setSignupDone: (v: boolean) => void;
  setLoginDone: (v: boolean) => void;
  incrementRegisteredChildrenCount: () => void;
  reset: () => void;
}

const initialState = {
  loginId: '',
  password: '',
  name: '',
  email: '',
  phoneNumber: '',
  children: [],
  signupDone: false,
  loginDone: false,
  registeredChildrenCount: 0,
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
  setChildren: (v) => set({ children: v, registeredChildrenCount: 0 }),
  setSignupDone: (v) => set({ signupDone: v }),
  setLoginDone: (v) => set({ loginDone: v }),
  incrementRegisteredChildrenCount: () =>
    set((state) => ({ registeredChildrenCount: state.registeredChildrenCount + 1 })),
  reset: () => set(initialState),
}));
