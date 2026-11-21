import { useIsFocused } from '@react-navigation/native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { queryClient, resourceKey } from '../../query/client';
import { useApiMutation, useSessionScope } from '../../query/hooks';
import { notificationListOptions, readNotifications } from '../../query/notifications';
import { useChildrenQuery, useUnreadQuery } from '../../query/resources';

const useNotificationList = () => {
  const scope = useSessionScope();
  const focused = useIsFocused();
  const childrenQuery = useChildrenQuery();
  useUnreadQuery();
  const query = useInfiniteQuery(
    {
      ...notificationListOptions(scope),
      enabled: scope.authenticated,
      subscribed: focused,
    },
    queryClient
  );
  const firstFocus = useRef(true);
  const loadInitial = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: resourceKey(scope.version, scope.language, 'notifications'),
      exact: true,
    });
  }, [scope.version, scope.language]);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      loadInitial();
    }, [loadInitial])
  );
  const notifications = Array.from(
    new Map(
      (query.data?.pages.flatMap((page) => page.notifications) ?? []).map((item) => [item.id, item])
    ).values()
  );
  const read = useApiMutation(readNotifications);
  return {
    notifications,
    children: (childrenQuery.data ?? []).map((child) => ({
      id: child.id,
      name: child.name,
      colorCode: child.colorCode,
    })),
    isLoading: query.isLoading || childrenQuery.isLoading,
    loadError: query.isError || childrenQuery.isError,
    isFetchingMore: query.isFetchingNextPage,
    loadInitial,
    loadMore: async () => {
      if (focused && query.hasNextPage && !query.isFetching)
        await query.fetchNextPage({ cancelRefetch: false });
    },
    markAsRead: async (id: number) => {
      if (!notifications.some((item) => item.id === id && !item.read)) return;
      try {
        await read(
          id,
          notifications.map((item) => item.id)
        );
      } catch {
        /* The authoritative list is reconciled after a lost response. */
      }
    },
    handleMarkAllRead: async () => {
      try {
        await read(
          'all',
          notifications.map((item) => item.id)
        );
      } catch {
        /* Preserve the last confirmed data on failure. */
      }
    },
  };
};
export default useNotificationList;
