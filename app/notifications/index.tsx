import { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../src/components/common/Header';
import HeaderMenuButton from '../../src/components/common/HeaderMenuButton';
import ChildFilterBar from '../../src/components/common/ChildFilterBar';
import { type NotificationApiItem, type NotificationType } from '../../src/api/notifications';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/notifications/notifications';
import useNotificationList from '../../src/hooks/notifications/useNotificationList';
import { fmt } from '../../src/utils/date';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

const ICON_CONFIG: Record<NotificationType, { bg: string; icon: FeatherName; color: string }> = {
  NEWSLETTER_ANALYSIS: { bg: colors.primary[100], icon: 'file-text', color: colors.primary[300] },
  CALENDAR_EVENT: { bg: colors.pink[100], icon: 'calendar', color: colors.pink[300] },
  DEADLINE_REMINDER: { bg: colors.pink[100], icon: 'calendar', color: colors.pink[300] },
  CHECKLIST_DUE: { bg: colors.secondary[100], icon: 'check-square', color: colors.secondary[500] },
  WEEKLY_SUMMARY: { bg: colors.secondary[100], icon: 'mail', color: colors.secondary[500] },
  SYSTEM: { bg: colors.primary[100], icon: 'info', color: colors.primary[400] },
  ANNOUNCEMENT: { bg: colors.primary[100], icon: 'bell', color: colors.primary[400] },
};

type ListRow = { kind: 'header'; date: string } | { kind: 'item'; data: NotificationApiItem };

const NotificationsScreen = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const insets = useSafeAreaInsets();
  const now = new Date();
  const todayStr = fmt(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = fmt(yesterdayDate);

  const [selectedChildName, setSelectedChildName] = useState<string | undefined>(undefined);

  const {
    notifications,
    children,
    isLoading,
    loadError,
    isFetchingMore,
    loadInitial,
    loadMore,
    markAsRead,
    handleMarkAllRead,
  } = useNotificationList();

  const handlePress = useCallback(
    (item: NotificationApiItem) => {
      markAsRead(item.id);
      switch (item.type) {
        case 'NEWSLETTER_ANALYSIS':
          if (item.payload.newsletterId) {
            router.push({
              pathname: '/newsletter/[id]',
              params: { id: item.payload.newsletterId },
            });
          }
          break;
        case 'CALENDAR_EVENT':
        case 'DEADLINE_REMINDER':
        case 'CHECKLIST_DUE':
          router.push({
            pathname: '/(tabs)/calendar',
            params: item.payload.targetDate ? { date: item.payload.targetDate } : {},
          });
          break;
        case 'WEEKLY_SUMMARY':
          router.push('/(tabs)/calendar');
          break;
        default:
          break;
      }
    },
    [markAsRead]
  );

  const getTimeLabel = (createdAt: string): string => {
    const diffMin = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (diffMin < 1) return t('notifications.timeJustNow');
    if (diffMin < 60) return t('notifications.timeMinutesAgo', { count: diffMin });
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return t('notifications.timeHoursAgo', { count: diffHour });
    return '';
  };

  const getDateLabel = (dateStr: string): string => {
    if (dateStr === todayStr) return t('notifications.today');
    if (dateStr === yesterdayStr) return t('notifications.yesterday');
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Intl.DateTimeFormat(i18nInstance.language, {
      month: 'long',
      day: 'numeric',
    }).format(new Date(year, month - 1, day));
  };

  const filtered = useMemo(
    () =>
      selectedChildName === undefined
        ? notifications
        : notifications.filter((n) => n.payload.childName === selectedChildName),
    [notifications, selectedChildName]
  );

  const groupedByDate = useMemo(() => {
    const groups: Record<string, NotificationApiItem[]> = {};
    filtered.forEach((item) => {
      const dateKey = item.createdAt.split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const flatRows = useMemo<ListRow[]>(
    () =>
      groupedByDate.flatMap(([date, items]) => [
        { kind: 'header', date } as ListRow,
        ...items.map((data) => ({ kind: 'item', data }) as ListRow),
      ]),
    [groupedByDate]
  );

  const renderDateHeader = (date: string) => (
    <View style={styles.dateLabelRow}>
      <Text style={styles.dateLabelText}>{getDateLabel(date)}</Text>
    </View>
  );

  const renderItem = (item: NotificationApiItem) => {
    const config = ICON_CONFIG[item.type];
    const timeLabel = getTimeLabel(item.createdAt);
    return (
      <TouchableOpacity
        key={item.id}
        style={item.read ? styles.notifRowRead : styles.notifRowUnread}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
          <Feather name={config.icon} size={24} color={config.color} />
        </View>
        <View style={styles.textArea}>
          <View style={styles.notifTitleRow}>
            <Text style={styles.notifTitle}>{item.title}</Text>
            {timeLabel ? <Text style={styles.timeText}>{timeLabel}</Text> : null}
          </View>
          <Text style={styles.notifBody}>{item.body}</Text>
          {item.payload.childName != null && (
            <View style={styles.tagRow}>
              <View style={styles.childTag}>
                <Text style={styles.childTagText}>{item.payload.childName}</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" color={colors.primary[400]} style={styles.loader} />;
    }
    if (loadError) {
      return (
        <View style={styles.errorBox}>
          <Text style={styles.emptyText}>{t('notifications.loadError')}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadInitial} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <FlatList
        data={flatRows}
        keyExtractor={(row) => (row.kind === 'header' ? `h-${row.date}` : `n-${row.data.id}`)}
        renderItem={({ item: row }) =>
          row.kind === 'header' ? renderDateHeader(row.date) : renderItem(row.data)
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('notifications.empty')}</Text>}
        ListFooterComponent={
          <>
            {isFetchingMore && (
              <ActivityIndicator size="small" color={colors.primary[400]} style={styles.loader} />
            )}
            <View style={{ height: insets.bottom }} />
          </>
        }
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <Header
          title={t('notifications.title')}
          onBack={() => router.back()}
          rightComponent={
            <HeaderMenuButton
              icon="settings-outline"
              menuItems={[
                {
                  label: t('notifications.settingsMenu'),
                  onPress: () => router.push('/profile/notification'),
                },
                {
                  label: t('notifications.markAllRead'),
                  onPress: handleMarkAllRead,
                },
              ]}
            />
          }
        />
      </View>

      <ChildFilterBar
        items={children}
        selectedChildName={selectedChildName}
        onSelect={setSelectedChildName}
      />

      {renderContent()}
    </View>
  );
};

export default NotificationsScreen;
