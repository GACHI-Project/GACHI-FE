import {
  updateNotificationPreference,
  type NotificationPreference,
  type UserInfo,
} from '../api/user';
import { assertCurrentSession, getSessionVersion } from '../utils/authSession';
import { queryClient } from './client';

export const saveNotificationPreference = async (preference: NotificationPreference) => {
  const version = getSessionVersion();
  await updateNotificationPreference(preference);
  assertCurrentSession(version);
  const filters = {
    predicate: (query: { queryKey: readonly unknown[] }) =>
      query.queryKey[1] === version && query.queryKey[3] === 'profile',
  };
  await queryClient.cancelQueries(filters);
  assertCurrentSession(version);
  queryClient.setQueriesData<UserInfo>(filters, (data) =>
    data
      ? { ...data, notificationPreference: preference, notificationEnabled: preference !== 'OFF' }
      : data
  );
};
