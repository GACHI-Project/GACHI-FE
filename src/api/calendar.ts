import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from './auth';

export class CalendarApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'CalendarApiError';
  }
}

const wrapError = (error: unknown): Error => {
  if (axios.isAxiosError(error) && error.response) {
    return new CalendarApiError(
      error.response.data?.code ?? `HTTP${error.response.status}`,
      error.response.data?.message ?? '알 수 없는 오류',
      error.response.status
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
  type?: string;
  content: string;
  detail: string | null;
  isCompleted: boolean;
  dueDate?: string | null;
  targetDate?: string | null;
  targetDateLabel?: string | null;
}

export interface CalendarEvent {
  eventId: number;
  title: string;
  startAt: string;
  endAt: string | null;
  periodStartAt?: string | null;
  allDay?: boolean | null;
  endAllDay?: boolean | null;
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

export interface CalendarPreviewItem {
  tempEventId: string;
  title: string;
  titleI18n?: Record<string, string> | null;
  extractedDate: string | null;
  isDateExtracted: boolean;
  checklistIds?: number[] | null;
  startAt?: string | null;
  endAt?: string | null;
  periodStartAt?: string | null;
  allDay?: boolean | null;
}

export const getCalendarPreview = async (newsletterId: number): Promise<CalendarPreviewItem[]> => {
  try {
    const headers = await getAuthHeader();
    const response = await apiClient.get<{ result: { events: CalendarPreviewItem[] } }>(
      `/api/v1/newsletters/${newsletterId}/calendar/preview`,
      { headers }
    );
    return response.data.result?.events ?? [];
  } catch (error) {
    throw wrapError(error);
  }
};

export interface CalendarDatePatchEvent {
  tempEventId: string;
  correctedDate: string;
}

export const patchCalendarPreviewDates = async (
  newsletterId: number,
  events: CalendarDatePatchEvent[]
): Promise<void> => {
  try {
    const headers = await getAuthHeader();
    await apiClient.patch(
      `/api/v1/newsletters/${newsletterId}/calendar/preview/dates`,
      { events },
      { headers }
    );
  } catch (error) {
    throw wrapError(error);
  }
};

export interface CalendarPostEvent {
  tempEventId: string;
  title: string;
  startAt: string;
  endAt: string | null;
}

export const postCalendarEvents = async (
  newsletterId: number,
  events: CalendarPostEvent[]
): Promise<{ registeredCount: number }> => {
  try {
    const headers = await getAuthHeader();
    const response = await apiClient.post<{ result: { registeredCount: number } }>(
      `/api/v1/newsletters/${newsletterId}/calendar`,
      { events },
      { headers }
    );
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

// ─── 학사일정 (NEIS) ────────────────────────────────────────────────────────

export interface GradeEventYn {
  grade1: 'Y' | 'N';
  grade2: 'Y' | 'N';
  grade3: 'Y' | 'N';
  grade4: 'Y' | 'N';
  grade5: 'Y' | 'N';
  grade6: 'Y' | 'N';
}

export interface HolidayItem {
  date: string;
  academicYear: string;
  eventName: string;
  eventContent: string;
  gradeEventYn: GradeEventYn;
}

export interface SchoolGroupChild {
  childId: number;
  childName: string;
  grade: number;
  colorCode: string;
}

export interface SchoolGroup {
  schoolGroupKey: string;
  officeCode: string;
  schoolCode: string;
  schoolName: string;
  childIds: number[];
  children: SchoolGroupChild[];
  schedules: HolidayItem[];
}

export interface SchoolScheduleResult {
  commonHolidays: HolidayItem[];
  schoolSchedules: SchoolGroup[];
}

export const fetchSchoolSchedules = async (
  fromDate: string,
  toDate: string
): Promise<SchoolScheduleResult> => {
  try {
    const headers = await getAuthHeader();
    const response = await apiClient.get<{ result: SchoolScheduleResult }>(
      '/api/v1/calendars/school-schedules',
      { headers, params: { fromDate, toDate } }
    );
    return response.data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

// ────────────────────────────────────────────────────────────────────────────

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
