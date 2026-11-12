import { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationApiItem,
} from '../../api/notifications';
import { fetchChildren, type ChildInfo } from '../../api/calendar';
import { useNotificationStore } from '../../store/notificationStore';
import { getSessionVersion, isCurrentSession } from '../../utils/authSession';

const useNotificationList = () => {
  const { setUnreadCount } = useNotificationStore();

  const [notifications, setNotifications] = useState<NotificationApiItem[]>([]);
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const notificationsRef = useRef<NotificationApiItem[]>([]);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const loadInitial = useCallback(() => {
    const version = getSessionVersion();
    setIsLoading(true);
    setLoadError(false);
    Promise.all([fetchNotifications({ size: 20 }), fetchChildren()])
      .then(([notifResult, childrenResult]) => {
        if (!isCurrentSession(version)) return;
        setNotifications(notifResult.notifications);
        setCursor(notifResult.nextCursor);
        setHasNext(notifResult.hasNext);
        setChildren(childrenResult);
        setUnreadCount(notifResult.notifications.filter((n) => !n.read).length);
      })
      .catch(() => {
        if (isCurrentSession(version)) setLoadError(true);
      })
      .finally(() => {
        if (isCurrentSession(version)) setIsLoading(false);
      });
  }, [setUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      loadInitial();
    }, [loadInitial])
  );

  const loadMore = useCallback(async () => {
    if (!hasNext || isFetchingMore) return;
    const version = getSessionVersion();
    setIsFetchingMore(true);
    try {
      const result = await fetchNotifications({ cursor: cursor ?? undefined, size: 20 });
      if (!isCurrentSession(version)) return;
      setNotifications((prev) => [...prev, ...result.notifications]);
      setCursor(result.nextCursor);
      setHasNext(result.hasNext);
    } catch {
      // 무한 스크롤 실패는 조용히 처리
    } finally {
      if (isCurrentSession(version)) setIsFetchingMore(false);
    }
  }, [hasNext, isFetchingMore, cursor]);

  const markAsRead = useCallback(
    (id: number) => {
      const version = getSessionVersion();
      const target = notificationsRef.current.find((n) => n.id === id);
      if (!target || target.read) return;
      const originalUnreadCount = notificationsRef.current.filter((n) => !n.read).length;
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount(Math.max(0, originalUnreadCount - 1));
      markNotificationRead(id).catch(() => {
        if (!isCurrentSession(version)) return;
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
        setUnreadCount(originalUnreadCount);
      });
    },
    [setUnreadCount]
  );

  const handleMarkAllRead = useCallback(() => {
    const version = getSessionVersion();
    const snapshot = notificationsRef.current;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    markAllNotificationsRead().catch(() => {
      if (!isCurrentSession(version)) return;
      setNotifications(snapshot);
      setUnreadCount(snapshot.filter((n) => !n.read).length);
    });
  }, [setUnreadCount]);

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
