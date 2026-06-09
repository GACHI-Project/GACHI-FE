import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from './auth';

export class ChildApiError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ChildApiError';
  }
}

const wrapError = (error: unknown): Error => {
  if (axios.isAxiosError(error) && error.response?.data?.code) {
    return new ChildApiError(
      error.response.data.code,
      error.response.data.message ?? '알 수 없는 오류'
    );
  }
  return error instanceof Error ? error : new Error(String(error));
};

const getAuthHeader = async () => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (!token) throw new ChildApiError('UNAUTHORIZED', '로그인이 필요합니다.');
  return { Authorization: `Bearer ${token}` };
};

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

export const registerChild = async (child: ChildPayload): Promise<ChildResult> => {
  try {
    const headers = await getAuthHeader();
    const response = await apiClient.post<{ result: ChildResult }>('/api/v1/children', child, {
      headers,
    });
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const registerChildren = async (children: ChildPayload[]): Promise<ChildResult[]> => {
  try {
    const headers = await getAuthHeader();
    const results = await Promise.all(
      children.map((child) =>
        apiClient.post<{ result: ChildResult }>('/api/v1/children', child, { headers })
      )
    );
    return results.map((res) => res.data.result);
  } catch (error) {
    throw wrapError(error);
  }
};

export const getMyChildren = async (): Promise<ChildResult[]> => {
  try {
    const headers = await getAuthHeader();
    const response = await apiClient.get<{ result: ChildResult[] }>('/api/v1/children', {
      headers,
    });
    return response.data.result ?? [];
  } catch (error) {
    throw wrapError(error);
  }
};

export type ChildItem = ChildResult;

export const fetchChildren = async (): Promise<ChildItem[]> => getMyChildren();

export interface UpdateChildParams {
  name: string;
  schoolName: string;
  schoolCode: string;
  officeCode?: string;
  grade: number;
  colorCode: string;
  className: string;
}

export const updateChild = async (childId: number, params: UpdateChildParams): Promise<void> => {
  try {
    const headers = await getAuthHeader();
    await apiClient.patch(`/api/v1/children/${childId}`, params, { headers });
  } catch (error) {
    throw wrapError(error);
  }
};

export const deleteChild = async (childId: number): Promise<void> => {
  try {
    const headers = await getAuthHeader();
    await apiClient.delete(`/api/v1/children/${childId}`, { headers });
  } catch (error) {
    throw wrapError(error);
  }
};
