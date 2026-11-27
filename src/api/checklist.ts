import { ApiError, toApiError } from './errors';
import { apiClient } from './client';
import { getAuthRequestConfig } from '../auth/session';

export class ChecklistApiError extends ApiError {}

const wrapError = (error: unknown) => toApiError(error, ChecklistApiError);

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
