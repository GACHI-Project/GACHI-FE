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
