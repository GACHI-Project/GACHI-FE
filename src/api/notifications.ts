import axios from 'axios';
import { apiClient, getAuthRequestConfig } from './auth';

export class NotificationApiError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'NotificationApiError';
  }
}

const wrapError = (error: unknown): Error => {
  if (axios.isAxiosError(error) && error.response?.data?.code) {
    return new NotificationApiError(
      error.response.data.code,
      error.response.data.message ?? '알 수 없는 오류'
    );
  }
  return error instanceof Error ? error : new Error(String(error));
};

const getAuthConfig = (version?: number) =>
  getAuthRequestConfig(
    () => new NotificationApiError('UNAUTHORIZED', '로그인이 필요합니다.'),
    version
  );

export type NotificationType =
  | 'NEWSLETTER_ANALYSIS'
  | 'CALENDAR_EVENT'
  | 'DEADLINE_REMINDER'
  | 'CHECKLIST_DUE'
  | 'WEEKLY_SUMMARY'
  | 'SYSTEM'
  | 'ANNOUNCEMENT';

export interface NotificationApiItem {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  payload: Record<string, string | undefined>;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResult {
  notifications: NotificationApiItem[];
  nextCursor: number | null;
  hasNext: boolean;
}

export interface FetchNotificationsParams {
  cursor?: number;
  size?: number;
  unreadOnly?: boolean;
}

export const fetchNotifications = async (
  params: FetchNotificationsParams = {}
): Promise<NotificationsResult> => {
  try {
    const config = await getAuthConfig();
    const { data } = await apiClient.get<{ result: NotificationsResult }>('/api/v1/notifications', {
      ...config,
      params,
    });
    return data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const markNotificationRead = async (notificationId: number): Promise<number> => {
  try {
    const config = await getAuthConfig();
    const { data } = await apiClient.patch<{ result: { readCount: number } }>(
      `/api/v1/notifications/${notificationId}/read`,
      undefined,
      config
    );
    return data.result.readCount;
  } catch (error) {
    throw wrapError(error);
  }
};

export const markAllNotificationsRead = async (): Promise<number> => {
  try {
    const config = await getAuthConfig();
    const { data } = await apiClient.patch<{ result: { readCount: number } }>(
      '/api/v1/notifications/read-all',
      undefined,
      config
    );
    return data.result.readCount;
  } catch (error) {
    throw wrapError(error);
  }
};

export interface RegisterPushTokenParams {
  platform: 'IOS' | 'ANDROID' | 'EXPO';
  token: string;
  deviceId: string;
  appVersion: string;
}

export interface PushTokenResult {
  id: number;
  platform: 'IOS' | 'ANDROID';
  deviceId: string;
  appVersion: string;
  enabled: boolean;
  lastRegisteredAt: string;
}

export const fetchUnreadCount = async (): Promise<number> => {
  try {
    const config = await getAuthConfig();
    const { data } = await apiClient.get<{ result: { unreadCount: number } }>(
      '/api/v1/notifications/unread-count',
      config
    );
    return data.result.unreadCount;
  } catch (error) {
    throw wrapError(error);
  }
};

export const registerPushToken = async (
  params: RegisterPushTokenParams
): Promise<PushTokenResult> => {
  try {
    const config = await getAuthConfig();
    const { data } = await apiClient.post<{ result: PushTokenResult }>(
      '/api/v1/notifications/tokens',
      params,
      config
    );
    return data.result;
  } catch (error) {
    throw wrapError(error);
  }
};
