import axios from 'axios';
import { apiClient, getAuthRequestConfig } from './auth';

export class SchoolGuideApiError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'SchoolGuideApiError';
  }
}

const wrapError = (error: unknown): Error => {
  if (axios.isAxiosError(error) && error.response?.data?.code) {
    return new SchoolGuideApiError(
      error.response.data.code,
      error.response.data.message ?? '알 수 없는 오류'
    );
  }
  return error instanceof Error ? error : new Error(String(error));
};

const getAuthConfig = (version?: number) =>
  getAuthRequestConfig(
    () => new SchoolGuideApiError('UNAUTHORIZED', '로그인이 필요합니다.'),
    version
  );

export type SchoolGuideCategoryEnum =
  | 'DOCUMENTS'
  | 'ATTENDANCE'
  | 'SCHOOL_EVENTS'
  | 'MEALS'
  | 'AFTERSCHOOL'
  | 'CURRICULUM'
  | 'GRADES'
  | 'TEACHER_COMMUNICATION'
  | 'HEALTH_SAFETY'
  | 'SCHOOL_RULES'
  | 'MULTICULTURAL'
  | 'ADMISSION';

export interface SchoolGuideCategory {
  category: SchoolGuideCategoryEnum;
  count: number;
}

export interface PopularFaq {
  faqId: number;
  question: string;
}

export interface SchoolGuideFaqItem {
  faqId: number;
  category: SchoolGuideCategoryEnum;
  question: string;
}

export interface SchoolGuideFaqDetail {
  faqId: number;
  category: SchoolGuideCategoryEnum;
  question: string;
  answer: string;
}

export const getSchoolGuideCategories = async (): Promise<SchoolGuideCategory[]> => {
  try {
    const config = await getAuthConfig();
    const response = await apiClient.get<{ result: { categories: SchoolGuideCategory[] } }>(
      '/api/v1/school-guide/categories',
      config
    );
    return response.data.result?.categories ?? [];
  } catch (error) {
    throw wrapError(error);
  }
};

export const getPopularFaqs = async (): Promise<PopularFaq[]> => {
  try {
    const config = await getAuthConfig();
    const response = await apiClient.get<{ result: { items: PopularFaq[] } }>(
      '/api/v1/school-guide/faqs/popular',
      config
    );
    return response.data.result?.items ?? [];
  } catch (error) {
    throw wrapError(error);
  }
};

type SchoolGuideFaqQuery =
  | { category: SchoolGuideCategoryEnum; search?: never }
  | { search: string; category?: never };

export const getSchoolGuideFaqs = async (
  params: SchoolGuideFaqQuery
): Promise<SchoolGuideFaqItem[]> => {
  try {
    if (params.category && params.search) {
      throw new SchoolGuideApiError(
        'INVALID_PARAMS',
        'category와 search는 동시에 전달할 수 없습니다.'
      );
    }
    const config = await getAuthConfig();
    const response = await apiClient.get<{ result: { items: SchoolGuideFaqItem[] } }>(
      '/api/v1/school-guide/faqs',
      { ...config, params }
    );
    return response.data.result?.items ?? [];
  } catch (error) {
    throw wrapError(error);
  }
};

export const getSchoolGuideFaqDetail = async (faqId: number): Promise<SchoolGuideFaqDetail> => {
  try {
    const config = await getAuthConfig();
    const response = await apiClient.get<{ result: SchoolGuideFaqDetail }>(
      `/api/v1/school-guide/faqs/${faqId}`,
      config
    );
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};
