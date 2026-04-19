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
};

export const useRegisterStore = create<RegisterState>((set) => ({
  ...initialState,
  setBasicInfo: (info) => set(info),
  setChildren: (v) => set({ children: v }),
  setSignupDone: (v) => set({ signupDone: v }),
  setLoginDone: (v) => set({ loginDone: v }),
  reset: () => set(initialState),
}));
