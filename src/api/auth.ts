import axios from 'axios';

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

const apiClient = axios.create({
  baseURL: 'https://43.202.191.103',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

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
