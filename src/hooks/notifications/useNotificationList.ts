import { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type FetchNotificationsParams,
  type NotificationsResult,
  type NotificationApiItem,
} from '../../api/notifications';
import { fetchChildren, type ChildInfo } from '../../api/calendar';
import {
  refreshUnreadCount,
  runNotificationRead,
  getNotificationReadVersion,
  waitForNotificationReads,
} from '../../utils/unreadCount';

interface ListRequest {
  cursor: number | null;
  hasNext: boolean;
  loading: boolean;
  loadingMore: boolean;
}

const useNotificationList = () => {
  const [notifications, setNotifications] = useState<NotificationApiItem[]>([]);
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const notificationsRef = useRef<NotificationApiItem[]>([]);
  const activeRequestRef = useRef<ListRequest | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      activeRequestRef.current = null;
    };
  }, []);

  const updateNotifications = useCallback(
    (update: (current: NotificationApiItem[]) => NotificationApiItem[]) => {
      const next = update(notificationsRef.current);
      notificationsRef.current = next;
      setNotifications(next);
    },
    []
  );

  // Retry a page if a read committed while it was loading, before applying stale read flags.
  const loadPage = useCallback(
    async (
      params: FetchNotificationsParams,
      request: ListRequest,
      apply: (result: NotificationsResult) => void
    ) => {
      while (activeRequestRef.current === request) {
        const revision = getNotificationReadVersion();
        // eslint-disable-next-line no-await-in-loop -- retries must use the latest committed read state.
        const result = await fetchNotifications(params);
        if (activeRequestRef.current !== request) return;
        // eslint-disable-next-line no-await-in-loop -- do not apply a page while its read flags can change.
        await waitForNotificationReads();
        if (activeRequestRef.current !== request) return;
        if (revision === getNotificationReadVersion()) {
          apply(result);
          return;
        }
      }
    },
    []
  );

  const loadInitial = useCallback(() => {
    const request: ListRequest = {
      cursor: null,
      hasNext: false,
      loading: true,
      loadingMore: false,
    };
    activeRequestRef.current = request;
    setIsLoading(true);
    setIsFetchingMore(false);
    setLoadError(false);
    void refreshUnreadCount().catch(() => {});

    Promise.all([
      loadPage({ size: 20 }, request, (result) => {
        updateNotifications(() => result.notifications);
        request.cursor = result.nextCursor;
        request.hasNext = result.hasNext;
      }),
      fetchChildren().then((result) => {
        if (activeRequestRef.current === request) setChildren(result);
      }),
    ])
      .catch(() => {
        if (activeRequestRef.current === request) setLoadError(true);
      })
      .finally(() => {
        if (activeRequestRef.current === request) {
          request.loading = false;
          setIsLoading(false);
        }
      });
  }, [loadPage, updateNotifications]);

  useFocusEffect(
    useCallback(() => {
      loadInitial();
      return () => {
        activeRequestRef.current = null;
      };
    }, [loadInitial])
  );

  const loadMore = useCallback(async () => {
    const request = activeRequestRef.current;
    if (!request || request.loading || request.loadingMore || !request.hasNext) return;
    request.loadingMore = true;
    setIsFetchingMore(true);
    try {
      await loadPage({ cursor: request.cursor ?? undefined, size: 20 }, request, (result) => {
        updateNotifications((current) => {
          const existingIds = new Set(current.map((item) => item.id));
          return [...current, ...result.notifications.filter((item) => !existingIds.has(item.id))];
        });
        request.cursor = result.nextCursor;
        request.hasNext = result.hasNext;
      });
    } catch {
      // The same cursor can be retried after a failed page request.
    } finally {
      if (activeRequestRef.current === request) {
        request.loadingMore = false;
        setIsFetchingMore(false);
      }
    }
  }, [loadPage, updateNotifications]);

  const markAsRead = useCallback(
    async (id: number) => {
      const target = notificationsRef.current.find((item) => item.id === id);
      if (!target || target.read) return;
      try {
        await runNotificationRead(id, () => markNotificationRead(id));
        if (mountedRef.current) {
          updateNotifications((current) =>
            current.map((item) => (item.id === id ? { ...item, read: true } : item))
          );
        }
      } catch {
        // No optimistic count or row update needs to be rolled back on failure.
      }
    },
    [updateNotifications]
  );

  const handleMarkAllRead = useCallback(async () => {
    const ids = new Set(notificationsRef.current.map((item) => item.id));
    try {
      await runNotificationRead('all', markAllNotificationsRead);
      if (mountedRef.current) {
        updateNotifications((current) =>
          current.map((item) => (ids.has(item.id) ? { ...item, read: true } : item))
        );
      }
    } catch {
      // Preserve rows, pages and successful individual reads on failure.
    }
  }, [updateNotifications]);

  return {
    notifications,
    children,
    isLoading,
    loadError,
    isFetchingMore,
    loadInitial,
    loadMore,
    markAsRead,
    handleMarkAllRead,
  };
};

export default useNotificationList;
