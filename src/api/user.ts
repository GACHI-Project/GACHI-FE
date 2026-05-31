import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from './auth';

const wrapError = (error: unknown): Error => {
  if (axios.isAxiosError(error) && error.response?.data?.code) {
    return new Error(error.response.data.message ?? '알 수 없는 오류');
  }
  return error instanceof Error ? error : new Error(String(error));
};

const getAuthHeader = async () => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (!token) throw new Error('로그인이 필요합니다.');
  return { Authorization: `Bearer ${token}` };
};

export interface UserProfile {
  userId: number;
  loginId: string;
  email: string;
  name: string;
  languageCode: string;
  notificationEnabled: boolean;
  createdAt: string;
}

export const getMe = async (): Promise<UserProfile> => {
  try {
    const headers = await getAuthHeader();
    const response = await apiClient.get<{ result: UserProfile }>('/api/v1/users/me', { headers });
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const updateLanguage = async (languageCode: string): Promise<void> => {
  try {
    const headers = await getAuthHeader();
    await apiClient.patch('/api/v1/users/me/language', { languageCode }, { headers });
  } catch (error) {
    throw wrapError(error);
  }
};
