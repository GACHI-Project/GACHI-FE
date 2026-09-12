import { Ionicons } from '@expo/vector-icons';

export type NotificationType = 'urgent' | 'important' | 'all' | 'none';

export interface NotificationOption {
  type: NotificationType;
  title: string;
  description: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  iconBordered?: boolean;
  iconFlipped?: boolean;
  badge?: string;
}

export type ServerNotificationPreference = 'ALL' | 'IMPORTANT' | 'URGENT_ONLY' | 'OFF';

const TO_SERVER: Record<NotificationType, ServerNotificationPreference> = {
  all: 'ALL',
  important: 'IMPORTANT',
  urgent: 'URGENT_ONLY',
  none: 'OFF',
};

const FROM_SERVER: Record<string, NotificationType> = {
  ALL: 'all',
  IMPORTANT: 'important',
  URGENT_ONLY: 'urgent',
  OFF: 'none',
};

export const toServerNotificationPreference = (
  type: NotificationType
): ServerNotificationPreference => TO_SERVER[type] ?? 'IMPORTANT';

export const fromServerNotificationPreference = (code: string): NotificationType =>
  FROM_SERVER[code] ?? 'important';
