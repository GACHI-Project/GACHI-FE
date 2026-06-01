import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from './auth';

export class UserApiError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'UserApiError';
  }
}

const wrapError = (error: unknown): Error => {
  if (axios.isAxiosError(error) && error.response?.data?.code) {
    return new UserApiError(
      error.response.data.code,
      error.response.data.message ?? '알 수 없는 오류'
    );
  }
  return error instanceof Error ? error : new Error(String(error));
};

const getAuthHeader = async () => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (!token) {
    throw new UserApiError('UNAUTHORIZED', '로그인이 필요합니다.');
  }
  return { Authorization: `Bearer ${token}` };
};

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
}

export const fetchMyInfo = async (): Promise<UserInfo> => {
  try {
    const headers = await getAuthHeader();
    const { data } = await apiClient.get<{ result: UserInfo }>('/api/v1/users/me', { headers });
    return data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const getMe = async (): Promise<UserInfo> => fetchMyInfo();

export const updateLanguage = async (languageCode: string): Promise<void> => {
  try {
    const headers = await getAuthHeader();
    await apiClient.patch('/api/v1/users/me/language', { languageCode }, { headers });
  } catch (error) {
    throw wrapError(error);
  }
};
