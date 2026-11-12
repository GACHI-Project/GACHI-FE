import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ServerNotificationPreference } from '../types/notification';
import { useUserStore } from '../store/userStore';
import { useChildrenStore } from '../store/childrenStore';
import { useNotificationStore } from '../store/notificationStore';
import { useRegisterStore } from '../store/registerStore';
import { useKakaoAuthStore } from '../store/kakaoAuthStore';
import { useGoogleAuthStore } from '../store/googleAuthStore';
import {
  getSessionVersion,
  isCurrentSession,
  invalidateSession,
  assertCurrentSession,
  assertSessionAuthenticated,
  markSessionAuthenticated,
} from '../utils/authSession';

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

type InternalSessionRequestConfig = InternalAxiosRequestConfig & {
  retried?: boolean;
  sessionVersion?: number;
};

export type SessionRequestConfig = AxiosRequestConfig & { sessionVersion: number };

type AuthTokenKey = 'accessToken' | 'refreshToken';
export interface SessionCleanupResult {
  success: boolean;
  failedTokenKeys: AuthTokenKey[];
}
const AUTH_TOKEN_KEYS: AuthTokenKey[] = ['accessToken', 'refreshToken'];

// Capture the session before token lookup, and carry it through dispatch/retries.
export const getAuthRequestConfig = async (
  createUnauthorizedError: () => Error,
  version = getSessionVersion()
): Promise<SessionRequestConfig> => {
  assertSessionAuthenticated(version);
  const token = await SecureStore.getItemAsync('accessToken');
  assertSessionAuthenticated(version);
  if (!token) throw createUnauthorizedError();
  return { headers: { Authorization: `Bearer ${token}` }, sessionVersion: version };
};

let refreshTask: {
  version: number;
  controller: AbortController;
  promise: Promise<string>;
} | null = null;
let clearingSession: Promise<SessionCleanupResult> | null = null;
let tokenWrite: Promise<void> = Promise.resolve();

export const saveAuthTokens = (
  tokens: { accessToken: string; refreshToken: string },
  version: number
): Promise<void> => {
  const write = tokenWrite.then(async () => {
    assertCurrentSession(version);
    if (clearingSession) throw new axios.CanceledError('Session is being cleared');
    await SecureStore.setItemAsync('accessToken', tokens.accessToken);
    assertCurrentSession(version);
    await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
    markSessionAuthenticated(version);
  });
  tokenWrite = write.catch(() => {});
  return write;
};

const refreshAccessToken = (version: number): Promise<string> => {
  if (refreshTask?.version === version) return refreshTask.promise;

  const controller = new AbortController();
  const promise = (async () => {
    try {
      const storedRefresh = await SecureStore.getItemAsync('refreshToken');
      assertCurrentSession(version);
      if (!storedRefresh) throw new AuthApiError('UNAUTHORIZED', '로그인이 필요합니다.');

      const { data } = await axios.post(
        `${apiClient.defaults.baseURL}/api/v1/auth/reissue`,
        { refreshToken: storedRefresh },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: apiClient.defaults.timeout,
          signal: controller.signal,
        }
      );
      await saveAuthTokens(data.result, version);
      return data.result.accessToken;
    } catch (error) {
      // 이전 세션의 늦은 실패로 새 세션을 종료하지 않는다.
      if (isCurrentSession(version)) await clearSession();
      throw error;
    } finally {
      if (refreshTask?.controller === controller) refreshTask = null;
    }
  })();
  refreshTask = { version, controller, promise };
  return promise;
};

apiClient.interceptors.request.use((config) => {
  const request = config as InternalSessionRequestConfig;
  request.sessionVersion ??= getSessionVersion();
  assertCurrentSession(request.sessionVersion);
  if (request.headers.Authorization) assertSessionAuthenticated(request.sessionVersion);
  if (clearingSession) throw new axios.CanceledError('Session is being cleared');
  return request;
});

apiClient.interceptors.response.use(
  (response) => {
    const request = response.config as InternalSessionRequestConfig;
    assertCurrentSession(request.sessionVersion!);
    return response;
  },
  async (error) => {
    const originalRequest = error.config as InternalSessionRequestConfig | undefined;

    if (originalRequest?.sessionVersion !== undefined) {
      assertCurrentSession(originalRequest.sessionVersion);
    }

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest.retried ||
      !originalRequest.headers.Authorization
    ) {
      return Promise.reject(error);
    }

    const version = originalRequest.sessionVersion!;
    assertCurrentSession(version);
    originalRequest.retried = true;
    const token = await refreshAccessToken(version);
    assertCurrentSession(version);
    originalRequest.headers.Authorization = `Bearer ${token}`;
    return apiClient(originalRequest);
  }
);

export const clearSession = (): Promise<SessionCleanupResult> => {
  if (clearingSession) return clearingSession;

  invalidateSession();
  refreshTask?.controller.abort();
  refreshTask = null;
  useUserStore.getState().reset();
  useChildrenStore.getState().reset();
  useNotificationStore.getState().reset();
  useRegisterStore.getState().reset();
  useKakaoAuthStore.getState().reset();
  useGoogleAuthStore.getState().reset();

  clearingSession = tokenWrite
    .then(async () => {
      Promise.resolve()
        .then(() => GoogleSignin.signOut())
        .catch(() => {});
      // 진행 중이던 토큰 저장이 끝난 뒤 삭제해 이전 토큰이 다시 남지 않게 한다.
      const results = await Promise.allSettled(
        AUTH_TOKEN_KEYS.map(async (key) => SecureStore.deleteItemAsync(key))
      );
      const failedKeys = AUTH_TOKEN_KEYS.filter((_, index) => results[index].status === 'rejected');
      const retries = await Promise.allSettled(
        failedKeys.map(async (key) => SecureStore.deleteItemAsync(key))
      );
      const failedTokenKeys = failedKeys.filter((_, index) => retries[index].status === 'rejected');
      router.replace('/(auth)/login');
      return { success: failedTokenKeys.length === 0, failedTokenKeys };
    })
    .finally(() => {
      clearingSession = null;
    });
  return clearingSession;
};

export const logout = async (): Promise<SessionCleanupResult | undefined> => {
  const version = getSessionVersion();
  try {
    const accessToken = await SecureStore.getItemAsync('accessToken');
    assertCurrentSession(version);
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    assertCurrentSession(version);
    if (accessToken) {
      const config: SessionRequestConfig = {
        headers: { Authorization: `Bearer ${accessToken}` },
        sessionVersion: version,
      };
      await apiClient.post('/api/v1/auth/logout', { refreshToken }, config);
    }
  } catch {
    // API 실패해도 로컬 토큰 삭제 후 로그인으로 이동
  }
  if (isCurrentSession(version)) return clearSession();
  return undefined;
};

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
  notificationPreference: ServerNotificationPreference;
}): Promise<SignupResult> => {
  try {
    const response = await apiClient.post('/api/v1/auth/signup', payload);
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const sendFindLoginIdCode = async (
  email: string
): Promise<{ codeTtlSeconds: number; resendCooldownSeconds: number }> => {
  try {
    const response = await apiClient.post('/api/v1/auth/find-login-id/email/send', { email });
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const findLoginId = async (email: string, code: string): Promise<{ loginId: string }> => {
  try {
    const response = await apiClient.post('/api/v1/auth/find-login-id/email/verify', {
      email: email.trim().toLowerCase(),
      code,
    });
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const sendFindPasswordCode = async (
  loginId: string,
  email: string
): Promise<{ codeTtlSeconds: number; resendCooldownSeconds: number }> => {
  try {
    const response = await apiClient.post('/api/v1/auth/password-reset/email/send', {
      loginId,
      email: email.trim().toLowerCase(),
    });
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const verifyPasswordResetCode = async (
  loginId: string,
  email: string,
  code: string
): Promise<void> => {
  try {
    await apiClient.post('/api/v1/auth/password-reset/email/verify', {
      loginId,
      email: email.trim().toLowerCase(),
      code,
    });
  } catch (error) {
    throw wrapError(error);
  }
};

export const resetPassword = async (
  loginId: string,
  email: string,
  password: string,
  passwordConfirm: string
): Promise<void> => {
  try {
    await apiClient.post('/api/v1/auth/password-reset', {
      loginId,
      email: email.trim().toLowerCase(),
      password,
      passwordConfirm,
    });
  } catch (error) {
    throw wrapError(error);
  }
};

export const getKakaoAuthorizeUrl = (): string =>
  `${apiClient.defaults.baseURL}/api/v1/auth/kakao/authorize`;

export interface KakaoTokens {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  rememberMe: boolean;
}

export interface KakaoCompleteResult {
  status: 'LOGIN_SUCCESS' | 'SIGNUP_REQUIRED' | 'LINK_REQUIRED';
  tokens?: KakaoTokens;
  signupToken?: string;
  linkToken?: string;
  email?: string;
  nickname?: string;
}

export const completeKakaoLogin = async (
  ticket: string,
  rememberMe: boolean
): Promise<KakaoCompleteResult> => {
  try {
    const response = await apiClient.post('/api/v1/auth/kakao/complete', {
      ticket,
      rememberMe,
    });
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const signupWithKakao = async (payload: {
  signupToken: string;
  consentAgreed: boolean;
  languageCode: string;
  notificationPreference: ServerNotificationPreference;
  rememberMe: boolean;
}): Promise<KakaoTokens> => {
  try {
    const response = await apiClient.post('/api/v1/auth/kakao/signup', payload);
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export interface GoogleCompleteResult {
  status: 'LOGIN_SUCCESS' | 'SIGNUP_REQUIRED' | 'LINK_REQUIRED';
  tokens?: LoginResult;
  signupToken?: string;
  linkToken?: string;
  email?: string;
  nickname?: string;
}

export const completeGoogleLogin = async (
  idToken: string,
  rememberMe: boolean
): Promise<GoogleCompleteResult> => {
  try {
    const response = await apiClient.post('/api/v1/auth/google/complete', {
      idToken,
      rememberMe,
    });
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const signupWithGoogle = async (payload: {
  signupToken: string;
  consentAgreed: boolean;
  languageCode: string;
  notificationPreference: ServerNotificationPreference;
  rememberMe: boolean;
}): Promise<LoginResult> => {
  try {
    const response = await apiClient.post('/api/v1/auth/google/signup', payload);
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};
