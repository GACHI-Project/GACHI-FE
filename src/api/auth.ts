import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

export class AuthApiError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

const wrapError = (error: unknown): Error => {
  if (axios.isAxiosError(error) && error.response?.data?.code) {
    return new AuthApiError(
      error.response.data.code,
      error.response.data.message ?? '알 수 없는 오류'
    );
  }
  return error instanceof Error ? error : new Error(String(error));
};

export const apiClient = axios.create({
  baseURL: 'https://43.202.191.103',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest._retry = true;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const storedRefresh = await SecureStore.getItemAsync('refreshToken');
      if (!storedRefresh) return Promise.reject(error);

      const { data } = await axios.post(
        `${apiClient.defaults.baseURL}/api/v1/auth/reissue`,
        { refreshToken: storedRefresh },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const { accessToken, refreshToken: newRefresh } = data.result;

      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', newRefresh);

      processQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      router.replace('/(auth)/login');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export const checkLoginId = async (loginId: string): Promise<{ available: boolean }> => {
  try {
    const response = await apiClient.post('/api/v1/auth/check-login-id', { loginId });
    return { available: response.data.result?.available ?? true };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      return { available: false };
    }
    throw wrapError(error);
  }
};

export const checkPhoneNumber = async (phoneNumber: string): Promise<{ available: boolean }> => {
  try {
    const response = await apiClient.post('/api/v1/auth/check-phone-number', { phoneNumber });
    return { available: response.data.result?.available ?? true };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      return { available: false };
    }
    throw wrapError(error);
  }
};

export const checkEmail = async (email: string): Promise<{ available: boolean }> => {
  try {
    const response = await apiClient.post('/api/v1/auth/check-email', { email });
    return { available: response.data.result?.available ?? true };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      return { available: false };
    }
    throw wrapError(error);
  }
};

export const sendEmailVerificationCode = async (
  email: string
): Promise<{ codeTtlSeconds: number; resendCooldownSeconds: number }> => {
  try {
    const response = await apiClient.post('/api/v1/auth/email/send', { email });
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export interface LoginResult {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  rememberMe: boolean;
}

export const login = async (
  loginId: string,
  password: string,
  rememberMe: boolean
): Promise<LoginResult> => {
  try {
    const response = await apiClient.post('/api/v1/auth/login', { loginId, password, rememberMe });
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const verifyEmailCode = async (email: string, code: string): Promise<void> => {
  try {
    await apiClient.post('/api/v1/auth/email/verify', {
      email: email.trim().toLowerCase(),
      code,
    });
  } catch (error) {
    throw wrapError(error);
  }
};

export interface SignupResult {
  userId: number;
  loginId: string;
  email: string;
  name: string;
  phoneNumber: string;
}

export const signup = async (payload: {
  name: string;
  email: string;
  loginId: string;
  password: string;
  passwordConfirm: string;
  phoneNumber: string;
  consentAgreed: boolean;
  languageCode: string;
}): Promise<SignupResult> => {
  try {
    const response = await apiClient.post('/api/v1/auth/signup', payload);
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

// TODO: 백엔드 API 연결 전 임시 mock — 실제 엔드포인트 확정 후 교체 필요
export const findLoginId = async (_email: string): Promise<{ loginId: string }> => {
  await new Promise<void>((resolve) => { setTimeout(resolve, 600); });
  return { loginId: 'gachi-gayo22' };
};

// TODO: 백엔드 API 연결 전 임시 mock — 실제 엔드포인트 확정 후 교체 필요
export const sendFindPasswordCode = async (_loginId: string, _email: string): Promise<void> => {
  await new Promise<void>((resolve) => { setTimeout(resolve, 600); });
};

// TODO: 백엔드 API 연결 전 임시 mock — 실제 엔드포인트 확정 후 교체 필요
export const resetPassword = async (
  _loginId: string,
  _newPassword: string,
  _newPasswordConfirm: string
): Promise<void> => {
  await new Promise<void>((resolve) => { setTimeout(resolve, 600); });
};
