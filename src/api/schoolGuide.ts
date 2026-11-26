import { ApiError, toApiError } from './errors';
import { apiClient } from './client';
import { getAuthRequestConfig } from '../auth/session';

export class SchoolGuideApiError extends ApiError {}

const wrapError = (error: unknown) => toApiError(error, SchoolGuideApiError);

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

export const getSchoolGuideCategories = async (
  signal?: AbortSignal
): Promise<SchoolGuideCategory[]> => {
  try {
    const config = await getAuthConfig();
    const response = await apiClient.get<{ result: { categories: SchoolGuideCategory[] } }>(
      '/api/v1/school-guide/categories',
      { ...config, signal }
    );
    return response.data.result?.categories ?? [];
  } catch (error) {
    throw wrapError(error);
  }
};

export const getPopularFaqs = async (signal?: AbortSignal): Promise<PopularFaq[]> => {
  try {
    const config = await getAuthConfig();
    const response = await apiClient.get<{ result: { items: PopularFaq[] } }>(
      '/api/v1/school-guide/faqs/popular',
      { ...config, signal }
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
  params: SchoolGuideFaqQuery,
  signal?: AbortSignal
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
      { ...config, params, signal }
    );
    return response.data.result?.items ?? [];
  } catch (error) {
    throw wrapError(error);
  }
};

export const getSchoolGuideFaqDetail = async (
  faqId: number,
  signal?: AbortSignal
): Promise<SchoolGuideFaqDetail> => {
  try {
    const config = await getAuthConfig();
    const response = await apiClient.get<{ result: SchoolGuideFaqDetail }>(
      `/api/v1/school-guide/faqs/${faqId}`,
      { ...config, signal }
    );
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};
