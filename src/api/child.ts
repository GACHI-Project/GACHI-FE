import { ApiError, toApiError } from './errors';
import { apiClient } from './client';
import { getAuthRequestConfig } from '../auth/session';

export class ChildApiError extends ApiError {}

const wrapError = (error: unknown) => toApiError(error, ChildApiError);

const getAuthConfig = (version?: number) =>
  getAuthRequestConfig(() => new ChildApiError('UNAUTHORIZED', '로그인이 필요합니다.'), version);

export interface ChildPayload {
  name: string;
  schoolName: string;
  schoolCode: string;
  officeCode: string;
  grade: number;
  colorCode: string;
  className: string;
}

export interface ChildResult {
  id: number;
  name: string;
  schoolName: string;
  schoolCode: string;
  officeCode: string;
  grade: number;
  colorCode: string;
  className: string | null;
  createdAt: string;
}

export const registerChild = async (
  child: ChildPayload,
  sessionVersion?: number,
  signal?: AbortSignal
): Promise<ChildResult> => {
  try {
    const config = await getAuthConfig(sessionVersion);
    const response = await apiClient.post<{ result: ChildResult }>('/api/v1/children', child, {
      ...config,
      signal,
    });
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const registerChildren = async (
  children: ChildPayload[],
  signal?: AbortSignal
): Promise<ChildResult[]> => {
  try {
    const config = await getAuthConfig();
    const results = await Promise.all(
      children.map((child) =>
        apiClient.post<{ result: ChildResult }>('/api/v1/children', child, { ...config, signal })
      )
    );
    return results.map((res) => res.data.result);
  } catch (error) {
    throw wrapError(error);
  }
};

export const getMyChildren = async (signal?: AbortSignal): Promise<ChildResult[]> => {
  try {
    const config = await getAuthConfig();
    const response = await apiClient.get<{ result: ChildResult[] }>('/api/v1/children', {
      ...config,
      signal,
    });
    return response.data.result ?? [];
  } catch (error) {
    throw wrapError(error);
  }
};

export type ChildItem = ChildResult;

export const fetchChildren = async (signal?: AbortSignal): Promise<ChildItem[]> =>
  getMyChildren(signal);

export interface UpdateChildParams {
  name: string;
  schoolName: string;
  schoolCode: string;
  officeCode?: string;
  grade: number;
  colorCode: string;
  className: string;
}

export const updateChild = async (
  childId: number,
  params: UpdateChildParams,
  signal?: AbortSignal
): Promise<void> => {
  try {
    const config = await getAuthConfig();
    await apiClient.patch(`/api/v1/children/${childId}`, params, { ...config, signal });
  } catch (error) {
    throw wrapError(error);
  }
};

export const deleteChild = async (childId: number, signal?: AbortSignal): Promise<void> => {
  try {
    const config = await getAuthConfig();
    await apiClient.delete(`/api/v1/children/${childId}`, { ...config, signal });
  } catch (error) {
    throw wrapError(error);
  }
};
