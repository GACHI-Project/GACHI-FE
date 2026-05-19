import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from './auth';

export class CalendarApiError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'CalendarApiError';
  }
}

const wrapError = (error: unknown): Error => {
  if (axios.isAxiosError(error) && error.response?.data?.code) {
    return new CalendarApiError(
      error.response.data.code,
      error.response.data.message ?? '알 수 없는 오류'
    );
  }
  return error instanceof Error ? error : new Error(String(error));
};

const getAuthHeader = async () => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (!token) {
    throw new CalendarApiError('UNAUTHORIZED', '로그인이 필요합니다.');
  }
  return { Authorization: `Bearer ${token}` };
};

export interface CalendarChecklist {
  checklistId: number;
  content: string;
  detail: string | null;
  isCompleted: boolean;
}

export interface CalendarEvent {
  eventId: number;
  title: string;
  startAt: string;
  endAt: string | null;
  dDay: number;
  childName: string | null;
  calendarColor: string;
  newsletterTitle: string;
  checklists: CalendarChecklist[];
}

export interface DailyResult {
  date: string;
  events: CalendarEvent[];
}

export interface WeeklyResult {
  today: string;
  weekStart: string;
  weekEnd: string;
  days: { date: string; events: CalendarEvent[] }[];
}

export interface ChildInfo {
  id: number;
  name: string;
  colorCode: string;
}

export interface MonthlyMarker {
  date: string;
  childName: string;
  childColor: string;
}

export const fetchChildren = async (): Promise<ChildInfo[]> => {
  try {
    const headers = await getAuthHeader();
    const response = await apiClient.get<{ result: ChildInfo[] }>('/api/v1/children', { headers });
    return response.data.result ?? [];
  } catch (error) {
    throw wrapError(error);
  }
};

export const fetchMonthlyMarkers = async (
  year: number,
  month: number,
  childName?: string
): Promise<MonthlyMarker[]> => {
  try {
    const headers = await getAuthHeader();
    const params: Record<string, unknown> = { year, month };
    if (childName) params.childName = childName;
    const response = await apiClient.get<{ result: { markedDates: MonthlyMarker[] } }>(
      '/api/v1/calendars/monthly',
      { headers, params }
    );
    return response.data.result?.markedDates ?? [];
  } catch (error) {
    throw wrapError(error);
  }
};

export const fetchDailyEvents = async (date: string, childName?: string): Promise<DailyResult> => {
  try {
    const headers = await getAuthHeader();
    const params: Record<string, unknown> = { date };
    if (childName) params.childName = childName;
    const response = await apiClient.get<{ result: DailyResult }>('/api/v1/calendars/daily', {
      headers,
      params,
    });
    return response.data.result ?? { date, events: [] };
  } catch (error) {
    throw wrapError(error);
  }
};

export const fetchWeeklyEvents = async (
  date: string,
  childName?: string
): Promise<WeeklyResult> => {
  try {
    const headers = await getAuthHeader();
    const params: Record<string, unknown> = { date };
    if (childName) params.childName = childName;
    const response = await apiClient.get<{ result: WeeklyResult }>('/api/v1/calendars/weekly', {
      headers,
      params,
    });
    return (
      response.data.result ?? {
        today: date,
        weekStart: date,
        weekEnd: date,
        days: [],
      }
    );
  } catch (error) {
    throw wrapError(error);
  }
};

export const completeChecklist = async (
  checklistId: number,
  isCompleted: boolean
): Promise<void> => {
  try {
    const headers = await getAuthHeader();
    await apiClient.patch(
      `/api/v1/checklists/${checklistId}/complete`,
      { isCompleted },
      { headers }
    );
  } catch (error) {
    throw wrapError(error);
  }
};
