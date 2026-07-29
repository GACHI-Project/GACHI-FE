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
    setIsLoading(true);
    setLoadError(false);
    Promise.all([fetchNotifications({ size: 20 }), fetchChildren()])
      .then(([notifResult, childrenResult]) => {
        setNotifications(notifResult.notifications);
        setCursor(notifResult.nextCursor);
        setHasNext(notifResult.hasNext);
        setChildren(childrenResult);
        setUnreadCount(notifResult.notifications.filter((n) => !n.read).length);
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  }, [setUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      loadInitial();
    }, [loadInitial])
  );

  const loadMore = useCallback(async () => {
    if (!hasNext || isFetchingMore) return;
    setIsFetchingMore(true);
    try {
      const result = await fetchNotifications({ cursor: cursor ?? undefined, size: 20 });
      setNotifications((prev) => [...prev, ...result.notifications]);
      setCursor(result.nextCursor);
      setHasNext(result.hasNext);
    } catch {
      // 무한 스크롤 실패는 조용히 처리
    } finally {
      setIsFetchingMore(false);
    }
  }, [hasNext, isFetchingMore, cursor]);

  const markAsRead = useCallback(
    (id: number) => {
      const target = notificationsRef.current.find((n) => n.id === id);
      if (!target || target.read) return;
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount(Math.max(0, notificationsRef.current.filter((n) => !n.read).length - 1));
      markNotificationRead(id).catch(() => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
        setUnreadCount(notificationsRef.current.filter((n) => !n.read).length);
      });
    },
    [setUnreadCount]
  );

  const handleMarkAllRead = useCallback(() => {
    const snapshot = notificationsRef.current;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    markAllNotificationsRead().catch(() => {
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
