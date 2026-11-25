import { infiniteQueryOptions, type InfiniteData } from '@tanstack/react-query';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type FetchNotificationsParams,
  type NotificationsResult,
} from '../api/notifications';
import {
  assertCurrentSession,
  getSessionVersion,
  isCurrentSession,
  subscribeSession,
} from '../utils/authSession';
import {
  getNotificationReadVersion,
  runNotificationRead,
  waitForNotificationReads,
} from '../utils/unreadCount';
import { queryClient, resourceKey } from './client';
import type { QueryScope } from './options';

const confirmed = new Set<number>();
let currentVersion = getSessionVersion();
subscribeSession(() => {
  if (getSessionVersion() !== currentVersion) {
    currentVersion = getSessionVersion();
    confirmed.clear();
  }
});

export const loadNotificationPage = async (
  params: FetchNotificationsParams,
  version: number,
  signal: AbortSignal
): Promise<NotificationsResult> => {
  assertCurrentSession(version);
  await waitForNotificationReads();
  const revision = getNotificationReadVersion();
  const result = await fetchNotifications(params, signal);
  await waitForNotificationReads();
  assertCurrentSession(version);
  if (revision !== getNotificationReadVersion())
    return loadNotificationPage(params, version, signal);
  return {
    ...result,
    notifications: result.notifications.map((item) =>
      confirmed.has(item.id) ? { ...item, read: true } : item
    ),
  };
};

export const notificationListOptions = (scope: QueryScope) =>
  infiniteQueryOptions({
    queryKey: resourceKey(scope.version, scope.language, 'notifications'),
    initialPageParam: undefined as number | undefined,
    queryFn: ({ pageParam, signal }) =>
      loadNotificationPage({ cursor: pageParam, size: 20 }, scope.version, signal),
    getNextPageParam: (last) => (last.hasNext ? (last.nextCursor ?? undefined) : undefined),
    staleTime: 0,
  });

export const readNotifications = async (id: number | 'all', loadedIds: number[]) => {
  const version = getSessionVersion();
  try {
    await runNotificationRead(id, () =>
      id === 'all' ? markAllNotificationsRead() : markNotificationRead(id)
    );
    assertCurrentSession(version);
    const ids = new Set(id === 'all' ? loadedIds : [id]);
    ids.forEach((value) => confirmed.add(value));
    queryClient.setQueriesData<InfiniteData<NotificationsResult>>(
      {
        predicate: (entry) =>
          entry.queryKey[1] === version && entry.queryKey[3] === 'notifications',
      },
      (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                notifications: page.notifications.map((item) =>
                  ids.has(item.id) ? { ...item, read: true } : item
                ),
              })),
            }
          : data
    );
  } finally {
    if (isCurrentSession(version)) {
      void queryClient.invalidateQueries({
        predicate: (entry) =>
          entry.queryKey[1] === version && entry.queryKey[3] === 'notifications',
      });
    }
  }
};
