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

const childApiClient = axios.create({
  baseURL: 'https://43.202.191.103',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

const getAuthHeader = async () => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (!token) throw new ChildApiError('UNAUTHORIZED', '로그인이 필요합니다.');
  return { Authorization: `Bearer ${token}` };
};

export interface ChildPayload {
  name: string;
  schoolName: string;
  schoolCode: string;
  grade: number;
  colorCode: string;
}

export interface ChildResult {
  id: number;
  name: string;
  schoolName: string;
  schoolCode: string;
  grade: number;
  colorCode: string;
  createdAt: string;
}

export const registerChild = async (
  child: ChildPayload,
  accessToken: string
): Promise<ChildResult> => {
  try {
    const response = await childApiClient.post<{ result: ChildResult }>('/api/v1/children', child, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const registerChildren = async (
  children: ChildPayload[],
  accessToken: string
): Promise<ChildResult[]> => {
  try {
    const results = await Promise.all(
      children.map((child) =>
        childApiClient.post<{ result: ChildResult }>('/api/v1/children', child, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
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
