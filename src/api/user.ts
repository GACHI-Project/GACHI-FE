import { ApiError, toApiError } from './errors';
import { apiClient } from './client';
import { getAuthRequestConfig } from '../auth/session';

export class UserApiError extends ApiError {}

const wrapError = (error: unknown) => toApiError(error, UserApiError);

const getAuthConfig = (version?: number) =>
  getAuthRequestConfig(() => new UserApiError('UNAUTHORIZED', '로그인이 필요합니다.'), version);

export interface UserInfo {
  userId: number;
  loginId: string;
  email: string;
  name: string;
  languageCode: string;
  phoneNumber: string;
  notificationEnabled: boolean;
  notificationPreference: string;
  createdAt: string;
  kakaoLinked: boolean;
  googleLinked: boolean;
  passwordLoginAvailable: boolean;
}

export const fetchMyInfo = async (signal?: AbortSignal): Promise<UserInfo> => {
  try {
    const config = await getAuthConfig();
    const { data } = await apiClient.get<{ result: UserInfo }>('/api/v1/users/me', {
      ...config,
      signal,
    });
    return data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const getMe = async (signal?: AbortSignal): Promise<UserInfo> => fetchMyInfo(signal);

export const updateLanguage = async (languageCode: string, signal?: AbortSignal): Promise<void> => {
  try {
    const config = await getAuthConfig();
    await apiClient.patch('/api/v1/users/me/language', { languageCode }, { ...config, signal });
  } catch (error) {
    throw wrapError(error);
  }
};

export type NotificationPreference = 'ALL' | 'IMPORTANT' | 'URGENT_ONLY' | 'OFF';

export const sendEmailChangeCode = async (
  email: string,
  currentPassword: string,
  signal?: AbortSignal
): Promise<{ codeTtlSeconds: number; resendCooldownSeconds: number }> => {
  try {
    const config = await getAuthConfig();
    const { data } = await apiClient.post(
      '/api/v1/users/me/email/send',
      { email, currentPassword },
      { ...config, signal }
    );
    return data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const verifyEmailChangeCode = async (
  email: string,
  code: string,
  signal?: AbortSignal
): Promise<void> => {
  try {
    const config = await getAuthConfig();
    await apiClient.post('/api/v1/users/me/email/verify', { email, code }, { ...config, signal });
  } catch (error) {
    throw wrapError(error);
  }
};

export const changeEmail = async (email: string, signal?: AbortSignal): Promise<void> => {
  try {
    const config = await getAuthConfig();
    await apiClient.patch('/api/v1/users/me/email', { email }, { ...config, signal });
  } catch (error) {
    throw wrapError(error);
  }
};

export const updateProfile = async (
  params: {
    name?: string;
    phoneNumber?: string;
  },
  signal?: AbortSignal
): Promise<void> => {
  try {
    const config = await getAuthConfig();
    await apiClient.patch('/api/v1/users/me/profile', params, { ...config, signal });
  } catch (error) {
    throw wrapError(error);
  }
};

export const updateNotificationPreference = async (
  notificationPreference: NotificationPreference,
  signal?: AbortSignal
): Promise<void> => {
  try {
    const config = await getAuthConfig();
    await apiClient.patch(
      '/api/v1/users/me/notification',
      { notificationPreference },
      { ...config, signal }
    );
  } catch (error) {
    throw wrapError(error);
  }
};

export const withdrawUser = async (
  currentPassword?: string,
  signal?: AbortSignal
): Promise<void> => {
  let responseData: { success?: boolean; code?: string; message?: string } | undefined;
  try {
    const config = await getAuthConfig();
    const { data } = await apiClient.delete('/api/v1/users/me', {
      ...config,
      ...(currentPassword ? { data: { currentPassword } } : {}),
      signal,
    });
    responseData = data;
  } catch (error) {
    throw wrapError(error);
  }
  if (responseData?.success === false) {
    throw new UserApiError(
      responseData.code ?? 'UNKNOWN',
      responseData.message ?? '알 수 없는 오류'
    );
  }
};

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

export const changePassword = async (
  payload: ChangePasswordPayload,
  signal?: AbortSignal
): Promise<void> => {
  let responseData: { success?: boolean; code?: string; message?: string } | undefined;
  try {
    const config = await getAuthConfig();
    const { data } = await apiClient.patch('/api/v1/users/me/password', payload, {
      ...config,
      signal,
    });
    responseData = data;
  } catch (error) {
    throw wrapError(error);
  }
  if (responseData?.success === false) {
    throw new UserApiError(
      responseData.code ?? 'UNKNOWN',
      responseData.message ?? '알 수 없는 오류'
    );
  }
};
