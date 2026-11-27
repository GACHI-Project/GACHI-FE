import axios from 'axios';
import { SchoolIdentity, SchoolResult } from '../types/school';
import { apiClient } from './auth';

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

export interface ClassItem {
  academicYear: string;
  grade: number;
  className: string;
}

export const fetchClasses = async (
  officeCode: string,
  schoolCode: string,
  grade: number,
  signal?: AbortSignal
): Promise<ClassItem[]> => {
  try {
    const response = await apiClient.get('/api/v1/schools/classes', {
      params: { officeCode, schoolCode, grade },
      signal,
    });
    return response.data.result?.classes ?? [];
  } catch (error) {
    throw wrapError(error);
  }
};

export const searchSchools = async (
  keyword: string,
  size?: number,
  signal?: AbortSignal
): Promise<SchoolResult[]> => {
  try {
    const response = await apiClient.get<{ result: SchoolSearchResult }>('/api/v1/schools/search', {
      params: { keyword, size: size ?? 10 },
      signal,
    });
    return response.data.result.schools;
  } catch (error) {
    throw wrapError(error);
  }
};

export const fetchSchoolDetails = async (
  school: SchoolIdentity,
  signal?: AbortSignal
): Promise<SchoolResult | null> => {
  const schools = await searchSchools(school.schoolName.trim(), 20, signal);
  return (
    schools.find(
      (candidate) =>
        candidate.schoolCode === school.schoolCode && candidate.officeCode === school.officeCode
    ) ?? null
  );
};
