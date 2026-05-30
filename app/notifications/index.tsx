import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Header from '../../src/components/common/Header';
import HeaderMenuButton from '../../src/components/common/HeaderMenuButton';
import ChildFilterBar from '../../src/components/common/ChildFilterBar';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/notifications/notifications';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

interface NotificationItem {
  id: string;
  type: 'deadline' | 'document' | 'checklist' | 'weekly';
  title: string;
  body: string;
  childName: string | null;
  timeLabel: string;
  isRead: boolean;
  date: 'today' | 'yesterday';
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'deadline',
    title: '봄 현장체험학습 동의서 제출',
    body: '봄 현장체험학습 동의서를 오늘까지 제출해야 해요',
    childName: '김첫째',
    timeLabel: '방금',
    isRead: false,
    date: 'today',
  },
  {
    id: '2',
    type: 'document',
    title: '새 가정통신문 분석 완료',
    body: '4월 급식 안내문 분석이 완료됐어요',
    childName: '김둘째',
    timeLabel: '1시간 전',
    isRead: false,
    date: 'today',
  },
  {
    id: '3',
    type: 'checklist',
    title: '미완료 할 일이 있어요',
    body: '동의서 서명하기 외 1개',
    childName: '김첫째',
    timeLabel: '3시간 전',
    isRead: false,
    date: 'today',
  },
  {
    id: '4',
    type: 'weekly',
    title: '이번 주 요약이 도착했어요',
    body: '완료 2개 · 미완료 1개 · 다가오는 일정 1개',
    childName: null,
    timeLabel: '어제',
    isRead: true,
    date: 'yesterday',
  },
  {
    id: '5',
    type: 'deadline',
    title: '학부모 상담 마감 D-3',
    body: '3일 뒤 마감이에요',
    childName: '김둘째',
    timeLabel: '어제',
    isRead: true,
    date: 'yesterday',
  },
];

const MOCK_CHILDREN = [
  { id: 1, name: '김첫째', colorCode: '#2BAEE0' },
  { id: 2, name: '김둘째', colorCode: '#FFD84D' },
];

const ICON_CONFIG: Record<
  NotificationItem['type'],
  { bg: string; icon: FeatherName; color: string }
> = {
  deadline: { bg: '#FCEBEB', icon: 'calendar', color: '#F9A0A0' },
  document: { bg: colors.primary[100], icon: 'file-text', color: colors.primary[300] },
  checklist: { bg: colors.secondary[100], icon: 'check-square', color: colors.secondary[500] },
  weekly: { bg: colors.secondary[100], icon: 'mail', color: colors.secondary[500] },
};

const NotificationsScreen = () => {
  const { t } = useTranslation();
  const [selectedChildName, setSelectedChildName] = useState<string | undefined>(undefined);

  const filtered = MOCK_NOTIFICATIONS.filter(
    (n) => selectedChildName === undefined || n.childName === selectedChildName
  );

  const todayItems = filtered.filter((n) => n.date === 'today');
  const yesterdayItems = filtered.filter((n) => n.date === 'yesterday');

  const renderItem = (item: NotificationItem) => {
    const config = ICON_CONFIG[item.type];
    return (
      <View key={item.id} style={item.isRead ? styles.notifRowRead : styles.notifRowUnread}>
        <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
          <Feather name={config.icon} size={24} color={config.color} />
        </View>
        <View style={styles.textArea}>
          <View style={styles.notifTitleRow}>
            <Text style={styles.notifTitle}>{item.title}</Text>
            <Text style={styles.timeText}>{item.timeLabel}</Text>
          </View>
          <Text style={styles.notifBody}>{item.body}</Text>
          {item.childName !== null && (
            <View style={styles.tagRow}>
              <View style={styles.childTag}>
                <Text style={styles.childTagText}>{item.childName}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
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
                  onPress: () => console.log('모두 읽음'),
                },
              ]}
            />
          }
        />
      </View>

      <ChildFilterBar
        items={MOCK_CHILDREN}
        selectedChildName={selectedChildName}
        onSelect={setSelectedChildName}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {filtered.length === 0 && <Text style={styles.emptyText}>{t('notifications.empty')}</Text>}
        {todayItems.length > 0 && (
          <>
            <View style={styles.dateLabelRow}>
              <Text style={styles.dateLabelText}>{t('notifications.today')}</Text>
            </View>
            {todayItems.map(renderItem)}
          </>
        )}
        {yesterdayItems.length > 0 && (
          <>
            <View style={styles.dateLabelRow}>
              <Text style={styles.dateLabelText}>{t('notifications.yesterday')}</Text>
            </View>
            {yesterdayItems.map(renderItem)}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default NotificationsScreen;
