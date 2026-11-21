import axios from 'axios';
import { apiClient, getAuthRequestConfig } from './auth';

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

const getAuthConfig = (version?: number) =>
  getAuthRequestConfig(
    () => new ChecklistApiError('UNAUTHORIZED', '로그인이 필요합니다.'),
    version
  );

export interface TodayChecklistItem {
  checklistId: number;
  isCompleted?: boolean;
  content: string;
  detail: string | null;
  newsletterTitle: string;
  childName: string;
}

export const getTodayChecklists = async (signal?: AbortSignal): Promise<TodayChecklistItem[]> => {
  try {
    const config = await getAuthConfig();
    const response = await apiClient.get<{ result: { checklists: TodayChecklistItem[] } }>(
      '/api/v1/checklists/today',
      { ...config, signal }
    );
    return response.data.result.checklists ?? [];
  } catch (error) {
    throw wrapError(error);
  }
};

export const toggleChecklistItem = async (
  checklistId: number,
  isCompleted: boolean,
  signal?: AbortSignal
): Promise<void> => {
  try {
    const config = await getAuthConfig();
    await apiClient.patch(
      `/api/v1/checklists/${checklistId}/complete`,
      { isCompleted },
      { ...config, signal }
    );
  } catch (error) {
    throw wrapError(error);
  }
};

export const deleteChecklistItem = async (
  checklistId: number,
  signal?: AbortSignal
): Promise<void> => {
  try {
    const config = await getAuthConfig();
    await apiClient.delete(`/api/v1/checklists/${checklistId}`, { ...config, signal });
  } catch (error) {
    throw wrapError(error);
  }
};
