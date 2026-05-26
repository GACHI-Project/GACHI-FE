import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from './auth';

export type NewsletterStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface NewsletterStatusResult {
  status: NewsletterStatus;
  progressPercent: number;
  progressMessage: string;
}

export class NewsletterApiError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'NewsletterApiError';
  }
}

const wrapError = (error: unknown): Error => {
  if (axios.isAxiosError(error) && error.response?.data?.code) {
    return new NewsletterApiError(
      error.response.data.code,
      error.response.data.message ?? '알 수 없는 오류'
    );
  }
  return error instanceof Error ? error : new Error(String(error));
};

const getAuthHeader = async () => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (!token) throw new NewsletterApiError('UNAUTHORIZED', '로그인이 필요합니다.');
  return { Authorization: `Bearer ${token}` };
};

interface RNFile {
  uri: string;
  name: string;
  type: string;
}

const getMimeType = (uri: string) => {
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  return 'image/jpeg';
};

export const uploadNewsletter = async (
  photoUri: string,
  childId?: number
): Promise<{ newsletterId: number; status: NewsletterStatus }> => {
  try {
    const authHeaders = await getAuthHeader();
    const filename = photoUri.split('/').pop() ?? 'scan.jpg';

    const mimeType = getMimeType(photoUri);
    const filePayload: RNFile = { uri: photoUri, name: filename, type: mimeType };
    const formData = new FormData();
    formData.append('file', filePayload as unknown as Blob);

    const params: Record<string, unknown> = { language: 'KO' };
    if (childId !== undefined && !Number.isNaN(childId)) {
      params.childId = childId;
    }

    const response = await apiClient.post<{
      result: { newsletterId: number; status: NewsletterStatus };
    }>('/api/v1/newsletters', formData, {
      headers: {
        ...authHeaders,
        'Content-Type': 'multipart/form-data',
      },
      params,
      timeout: 60000,
    });

    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export interface DateCandidate {
  originalText: string;
  normalizedDate: string;
  startOffset: number;
  endOffset: number;
  extractionType: string;
}

export interface NewsletterTranslationResult {
  originalText: string;
  translatedText?: string;
  language: string;
  fileUrl: string;
  dateCandidates?: DateCandidate[];
}

export const getNewsletterTranslation = async (
  newsletterId: number
): Promise<NewsletterTranslationResult> => {
  try {
    const headers = await getAuthHeader();
    const response = await apiClient.get<{ result: NewsletterTranslationResult }>(
      `/api/v1/newsletters/${newsletterId}/translation`,
      { headers }
    );
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export type ChecklistItemType = 'CHECKLIST' | 'TODO';

export interface ChecklistItem {
  checklistId: number;
  type: ChecklistItemType;
  content: string;
  detail: string | null;
  isCompleted: boolean;
  targetDate: string | null;
  targetDateLabel: string | null;
}

export const getNewsletterChecklist = async (
  newsletterId: number,
  type?: ChecklistItemType
): Promise<ChecklistItem[]> => {
  try {
    const headers = await getAuthHeader();
    const params: Record<string, string> = {};
    if (type) params.type = type;
    const response = await apiClient.get<{ result: { items: ChecklistItem[] } }>(
      `/api/v1/newsletters/${newsletterId}/checklist`,
      { headers, params }
    );
    return response.data.result.items;
  } catch (error) {
    throw wrapError(error);
  }
};

export interface NewsletterDetail {
  newsletterId: number;
  title: string;
  childName: string;
  summary: string;
  originalText: string;
  translatedText: string | null;
  language: string;
  isCalendarRegistered: boolean;
  createdAt: string;
}

export const getNewsletterDetail = async (newsletterId: number): Promise<NewsletterDetail> => {
  try {
    const headers = await getAuthHeader();
    const response = await apiClient.get<{ result: NewsletterDetail }>(
      `/api/v1/newsletters/${newsletterId}`,
      { headers }
    );
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export interface NewsletterSummaryResult {
  title: string;
  summary: string;
}

export const getNewsletterSummary = async (
  newsletterId: number
): Promise<NewsletterSummaryResult> => {
  try {
    const headers = await getAuthHeader();
    const response = await apiClient.get<{ result: NewsletterSummaryResult }>(
      `/api/v1/newsletters/${newsletterId}/summary`,
      { headers }
    );
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const getNewsletterStatus = async (
  newsletterId: number
): Promise<NewsletterStatusResult> => {
  try {
    const headers = await getAuthHeader();
    const response = await apiClient.get<{ result: NewsletterStatusResult }>(
      `/api/v1/newsletters/${newsletterId}/status`,
      { headers }
    );
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export interface RecentNewsletterItem {
  newsletterId: number;
  title: string;
  childName: string | null;
  childGrade: number | null;
}

export interface RecentNewsletterGroup {
  date: string;
  items: RecentNewsletterItem[];
}

export const getRecentNewsletters = async (limit = 5): Promise<RecentNewsletterGroup[]> => {
  try {
    const headers = await getAuthHeader();
    const response = await apiClient.get<{ result: { groups: RecentNewsletterGroup[] } }>(
      '/api/v1/newsletters/recent',
      { headers, params: { limit } }
    );
    return response.data.result.groups ?? [];
  } catch (error) {
    throw wrapError(error);
  }
};

export interface NewsletterItem {
  newsletterId: number;
  title: string;
  childName: string | null;
  childGrade: number | null;
  childColor: string | null;
  isCalendarRegistered: boolean;
  createdAt: string;
}

export interface NewsletterListResult {
  newsletters: NewsletterItem[];
  totalCount: number;
}

export const fetchNewsletters = async (params: {
  childName?: string;
  search?: string;
  page?: number;
  sort?: 'recent' | 'oldest';
}): Promise<NewsletterListResult> => {
  try {
    const headers = await getAuthHeader();
    const queryParams: Record<string, string | number> = {};
    if (params.childName) queryParams.childName = params.childName;
    if (params.search) queryParams.search = params.search;
    if (params.page !== undefined) queryParams.page = params.page;
    if (params.sort) queryParams.sort = params.sort;
    const response = await apiClient.get<{ result: NewsletterListResult }>('/api/v1/newsletters', {
      headers,
      params: queryParams,
    });
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};
