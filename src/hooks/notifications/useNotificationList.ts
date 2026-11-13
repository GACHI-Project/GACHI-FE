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

const PAGE_SIZE = 20;

interface ListRequest {
  cursor: number | null;
  hasNext: boolean;
  // Initial rows have been applied; loading can stay true while children are still loading.
  pageLoaded: boolean;
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
      pageLoaded: false,
      loading: true,
      loadingMore: false,
    };
    activeRequestRef.current = request;
    setIsLoading(true);
    setIsFetchingMore(false);
    setLoadError(false);
    void refreshUnreadCount().catch(() => {});

    Promise.all([
      loadPage({ size: PAGE_SIZE }, request, (result) => {
        updateNotifications(() => result.notifications);
        request.cursor = result.nextCursor;
        request.hasNext = result.hasNext;
        request.pageLoaded = true;
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
      await loadPage(
        { cursor: request.cursor ?? undefined, size: PAGE_SIZE },
        request,
        (result) => {
          updateNotifications((current) => {
            const existingIds = new Set(current.map((item) => item.id));
            return [
              ...current,
              ...result.notifications.filter((item) => !existingIds.has(item.id)),
            ];
          });
          request.cursor = result.nextCursor;
          request.hasNext = result.hasNext;
        }
      );
    } catch {
      // The same cursor can be retried after a failed page request.
    } finally {
      if (activeRequestRef.current === request) {
        request.loadingMore = false;
        setIsFetchingMore(false);
      }
    }
  }, [loadPage, updateNotifications]);

  // A failed write may still have committed on the server, and the total is refetched after it.
  // Recheck every loaded unread row so its read flag matches that total, without touching the
  // list cursor. New arrivals can push loaded rows to later pages, so follow cursors until all
  // loaded unread IDs have been seen.
  const resyncLoadedReads = useCallback(async () => {
    const request = activeRequestRef.current;
    // An initial page in flight already retries because the write bumped the read version.
    if (!mountedRef.current || !request || !request.pageLoaded) return;
    const loaded = notificationsRef.current;
    const pendingIds = new Set(loaded.filter((item) => !item.read).map((item) => item.id));
    const size = Math.max(loaded.length, PAGE_SIZE);
    let cursor: number | undefined;

    while (pendingIds.size > 0) {
      let result = null as NotificationsResult | null;
      // eslint-disable-next-line no-await-in-loop -- each page depends on the previous cursor.
      await loadPage(cursor === undefined ? { size } : { cursor, size }, request, (page) => {
        result = page;
      });
      if (!result || activeRequestRef.current !== request) return;

      const readItems = new Map<number, NotificationApiItem>();
      result.notifications.forEach((item) => {
        if (pendingIds.delete(item.id) && item.read) readItems.set(item.id, item);
      });
      if (readItems.size > 0) {
        // Read flags only move from unread to read, so never restore an unread flag here.
        updateNotifications((current) =>
          current.map((item) => {
            const fresh = readItems.get(item.id);
            return !item.read && fresh ? { ...item, read: true, readAt: fresh.readAt } : item;
          })
        );
      }
      if (!result.hasNext || result.nextCursor === null) return;
      cursor = result.nextCursor;
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
        // No optimistic update to roll back, but the write may have committed.
        // Keep the current rows if the resync fails; the next focus reloads the list.
        void resyncLoadedReads().catch(() => {});
      }
    },
    [updateNotifications, resyncLoadedReads]
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
      // Preserve rows, pages and successful individual reads, then resync possibly committed reads.
      void resyncLoadedReads().catch(() => {});
    }
  }, [updateNotifications, resyncLoadedReads]);

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
