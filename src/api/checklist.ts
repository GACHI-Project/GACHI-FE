import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from './auth';

export class ChecklistApiError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ChecklistApiError';
  }
}

const wrapError = (error: unknown): Error => {
  if (axios.isAxiosError(error) && error.response?.data?.code) {
    return new ChecklistApiError(
      error.response.data.code,
      error.response.data.message ?? '알 수 없는 오류'
    );
  }
  return error instanceof Error ? error : new Error(String(error));
};

const getAuthHeader = async () => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (!token) throw new ChecklistApiError('UNAUTHORIZED', '로그인이 필요합니다.');
  return { Authorization: `Bearer ${token}` };
};

export interface TodayChecklistItem {
  checklistId: number;
  content: string;
  detail: string | null;
  newsletterTitle: string;
  childName: string;
}

export const getTodayChecklists = async (): Promise<TodayChecklistItem[]> => {
  try {
    const headers = await getAuthHeader();
    const response = await apiClient.get<{ result: { checklists: TodayChecklistItem[] } }>(
      '/api/v1/checklists/today',
      { headers }
    );
    return response.data.result.checklists;
  } catch (error) {
    throw wrapError(error);
  }
};
