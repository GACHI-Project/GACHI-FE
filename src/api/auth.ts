import axios from 'axios';
import { getAuthRequestConfig, type SessionRequestConfig } from '../auth/session';
import { ServerNotificationPreference } from '../types/notification';
import { apiClient } from './client';
import { ApiError, toApiError } from './errors';

export class AuthApiError extends ApiError {}

const wrapError = (error: unknown) => toApiError(error, AuthApiError);

export const requestLogout = async (
  accessToken: string,
  refreshToken: string | null,
  version: number
): Promise<void> => {
  try {
    const config: SessionRequestConfig = {
      headers: { Authorization: `Bearer ${accessToken}` },
      sessionVersion: version,
    };
    await apiClient.post('/api/v1/auth/logout', { refreshToken }, config);
  } catch (error) {
    throw wrapError(error);
  }
};

const checkAvailability = async (
  path: string,
  payload: Record<string, string>,
  signal?: AbortSignal
): Promise<{ available: boolean }> => {
  try {
    const response = await apiClient.post(path, payload, { signal });
    return { available: response.data.result?.available ?? true };
  } catch (error) {
    if (!axios.isCancel(error) && axios.isAxiosError(error) && error.response?.status === 409) {
      return { available: false };
    }
    throw wrapError(error);
  }
};

export const checkLoginId = (loginId: string, signal?: AbortSignal) =>
  checkAvailability('/api/v1/auth/check-login-id', { loginId }, signal);

export const checkPhoneNumber = (phoneNumber: string, signal?: AbortSignal) =>
  checkAvailability('/api/v1/auth/check-phone-number', { phoneNumber }, signal);

export const checkEmail = (email: string, signal?: AbortSignal) =>
  checkAvailability('/api/v1/auth/check-email', { email }, signal);

export const sendEmailVerificationCode = async (
  email: string,
  signal?: AbortSignal
): Promise<{ codeTtlSeconds: number; resendCooldownSeconds: number }> => {
  try {
    const response = await apiClient.post('/api/v1/auth/email/send', { email }, { signal });
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
  rememberMe: boolean,
  signal?: AbortSignal
): Promise<LoginResult> => {
  try {
    const response = await apiClient.post(
      '/api/v1/auth/login',
      { loginId, password, rememberMe },
      { signal }
    );
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const verifyEmailCode = async (
  email: string,
  code: string,
  signal?: AbortSignal
): Promise<void> => {
  try {
    await apiClient.post(
      '/api/v1/auth/email/verify',
      {
        email: email.trim().toLowerCase(),
        code,
      },
      { signal }
    );
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

export const signup = async (
  payload: {
    name: string;
    email: string;
    loginId: string;
    password: string;
    passwordConfirm: string;
    phoneNumber: string;
    consentAgreed: boolean;
    languageCode: string;
    notificationPreference: ServerNotificationPreference;
  },
  signal?: AbortSignal
): Promise<SignupResult> => {
  try {
    const response = await apiClient.post('/api/v1/auth/signup', payload, { signal });
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const sendFindLoginIdCode = async (
  email: string,
  signal?: AbortSignal
): Promise<{ codeTtlSeconds: number; resendCooldownSeconds: number }> => {
  try {
    const response = await apiClient.post(
      '/api/v1/auth/find-login-id/email/send',
      { email },
      { signal }
    );
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const findLoginId = async (
  email: string,
  code: string,
  signal?: AbortSignal
): Promise<{ loginId: string }> => {
  try {
    const response = await apiClient.post(
      '/api/v1/auth/find-login-id/email/verify',
      {
        email: email.trim().toLowerCase(),
        code,
      },
      { signal }
    );
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const sendFindPasswordCode = async (
  loginId: string,
  email: string,
  signal?: AbortSignal
): Promise<{ codeTtlSeconds: number; resendCooldownSeconds: number }> => {
  try {
    const response = await apiClient.post(
      '/api/v1/auth/password-reset/email/send',
      {
        loginId,
        email: email.trim().toLowerCase(),
      },
      { signal }
    );
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const verifyPasswordResetCode = async (
  loginId: string,
  email: string,
  code: string,
  signal?: AbortSignal
): Promise<void> => {
  try {
    await apiClient.post(
      '/api/v1/auth/password-reset/email/verify',
      {
        loginId,
        email: email.trim().toLowerCase(),
        code,
      },
      { signal }
    );
  } catch (error) {
    throw wrapError(error);
  }
};

export const resetPassword = async (
  loginId: string,
  email: string,
  password: string,
  passwordConfirm: string,
  signal?: AbortSignal
): Promise<void> => {
  try {
    await apiClient.post(
      '/api/v1/auth/password-reset',
      {
        loginId,
        email: email.trim().toLowerCase(),
        password,
        passwordConfirm,
      },
      { signal }
    );
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
  rememberMe: boolean,
  signal?: AbortSignal
): Promise<KakaoCompleteResult> => {
  try {
    const response = await apiClient.post(
      '/api/v1/auth/kakao/complete',
      {
        ticket,
        rememberMe,
      },
      { signal }
    );
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const signupWithKakao = async (
  payload: {
    signupToken: string;
    consentAgreed: boolean;
    languageCode: string;
    notificationPreference: ServerNotificationPreference;
    rememberMe: boolean;
  },
  signal?: AbortSignal
): Promise<KakaoTokens> => {
  try {
    const response = await apiClient.post('/api/v1/auth/kakao/signup', payload, { signal });
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
  rememberMe: boolean,
  signal?: AbortSignal
): Promise<GoogleCompleteResult> => {
  try {
    const response = await apiClient.post(
      '/api/v1/auth/google/complete',
      {
        idToken,
        rememberMe,
      },
      { signal }
    );
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const signupWithGoogle = async (
  payload: {
    signupToken: string;
    consentAgreed: boolean;
    languageCode: string;
    notificationPreference: ServerNotificationPreference;
    rememberMe: boolean;
  },
  signal?: AbortSignal
): Promise<LoginResult> => {
  try {
    const response = await apiClient.post('/api/v1/auth/google/signup', payload, { signal });
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

const createUnauthorizedError = () => new AuthApiError('UNAUTHORIZED', '로그인이 필요합니다.');

export const linkGoogle = async (
  linkToken: string,
  rememberMe: boolean,
  version: number,
  signal?: AbortSignal
): Promise<LoginResult> => {
  try {
    const config = await getAuthRequestConfig(createUnauthorizedError, version);
    const response = await apiClient.post(
      '/api/v1/auth/google/link',
      { linkToken, rememberMe },
      { ...config, signal }
    );
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const linkKakao = async (
  linkToken: string,
  rememberMe: boolean,
  version: number,
  signal?: AbortSignal
): Promise<LoginResult> => {
  try {
    const config = await getAuthRequestConfig(createUnauthorizedError, version);
    const response = await apiClient.post(
      '/api/v1/auth/kakao/link',
      { linkToken, rememberMe },
      { ...config, signal }
    );
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const unlinkGoogle = async (version: number, signal?: AbortSignal): Promise<void> => {
  try {
    const config = await getAuthRequestConfig(createUnauthorizedError, version);
    await apiClient.delete('/api/v1/auth/google/link', { ...config, signal });
  } catch (error) {
    throw wrapError(error);
  }
};

export const unlinkKakao = async (version: number, signal?: AbortSignal): Promise<void> => {
  try {
    const config = await getAuthRequestConfig(createUnauthorizedError, version);
    await apiClient.delete('/api/v1/auth/kakao/link', { ...config, signal });
  } catch (error) {
    throw wrapError(error);
  }
};
