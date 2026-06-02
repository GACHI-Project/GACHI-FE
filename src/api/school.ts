import axios from 'axios';
import { apiClient } from './auth';
import { SchoolResult } from '../types/school';

const wrapError = (error: unknown): Error => {
  if (axios.isAxiosError(error) && error.response?.data?.code) {
    return new Error(error.response.data.message ?? '알 수 없는 오류');
  }
  return error instanceof Error ? error : new Error(String(error));
};

export interface SchoolSearchResult {
  keyword: string;
  totalCount: number;
  schools: SchoolResult[];
}

export const searchSchools = async (
  keyword: string,
  size: number = 10
): Promise<SchoolResult[]> => {
  try {
    const response = await apiClient.get<{ result: SchoolSearchResult }>('/api/v1/schools/search', {
      params: { keyword, size },
    });
    return response.data.result.schools;
  } catch (error) {
    throw wrapError(error);
  }
};
