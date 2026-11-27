import { ApiError, toApiError } from './errors';
import { apiClient } from './client';
import { getAuthRequestConfig } from '../auth/session';

export class NotificationApiError extends ApiError {}

const wrapError = (error: unknown) => toApiError(error, NotificationApiError);

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
  params?: FetchNotificationsParams,
  signal?: AbortSignal
): Promise<NotificationsResult> => {
  try {
    const config = await getAuthConfig();
    const { data } = await apiClient.get<{ result: NotificationsResult }>('/api/v1/notifications', {
      ...config,
      params,
      signal,
    });
    return data.result;
  } catch (error) {
    throw wrapError(error);
  }
};

export const markNotificationRead = async (
  notificationId: number,
  signal?: AbortSignal
): Promise<number> => {
  try {
    const config = await getAuthConfig();
    const { data } = await apiClient.patch<{ result: { readCount: number } }>(
      `/api/v1/notifications/${notificationId}/read`,
      undefined,
      { ...config, signal }
    );
    return data.result.readCount;
  } catch (error) {
    throw wrapError(error);
  }
};

export const markAllNotificationsRead = async (signal?: AbortSignal): Promise<number> => {
  try {
    const config = await getAuthConfig();
    const { data } = await apiClient.patch<{ result: { readCount: number } }>(
      '/api/v1/notifications/read-all',
      undefined,
      { ...config, signal }
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

export const fetchUnreadCount = async (signal?: AbortSignal): Promise<number> => {
  try {
    const config = await getAuthConfig();
    const { data } = await apiClient.get<{ result: { unreadCount: number } }>(
      '/api/v1/notifications/unread-count',
      { ...config, signal }
    );
    return data.result.unreadCount;
  } catch (error) {
    throw wrapError(error);
  }
};

export const registerPushToken = async (
  params: RegisterPushTokenParams,
  signal?: AbortSignal
): Promise<PushTokenResult> => {
  try {
    const config = await getAuthConfig();
    const { data } = await apiClient.post<{ result: PushTokenResult }>(
      '/api/v1/notifications/tokens',
      params,
      { ...config, signal }
    );
    return data.result;
  } catch (error) {
    throw wrapError(error);
  }
};
