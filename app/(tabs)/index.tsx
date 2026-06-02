import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { router, useFocusEffect } from 'expo-router';
import { useUserStore } from '../../src/store/userStore';
import { fetchUnreadCount } from '../../src/api/notifications';
import { useNotificationStore } from '../../src/store/notificationStore';
import TaskCard from '../../src/components/home/TaskCard';
import ScanBanner from '../../src/components/home/ScanBanner';
import FeatureSection from '../../src/components/home/FeatureSection';
import GuideCards from '../../src/components/home/GuideCards';
import RecentDocs from '../../src/components/home/RecentDocs';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/home/homeScreen';

const getGreetingByTime = (t: TFunction): string => {
  const hour = new Date().getHours();

  let key: string;
  if (hour >= 5 && hour < 11) {
    key = 'greetings.morning';
  } else if (hour >= 11 && hour < 14) {
    key = 'greetings.lunch';
  } else if (hour >= 14 && hour < 18) {
    key = 'greetings.afternoon';
  } else if (hour >= 18 && hour < 21) {
    key = 'greetings.evening';
  } else {
    key = 'greetings.night';
  }

  const arr = t(key, { returnObjects: true }) as string[];
  return arr[Math.floor(Math.random() * arr.length)];
};

const HomeScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const name = useUserStore((s) => s.name);
  const greetingText = useMemo(() => getGreetingByTime(t), [t]);

  const { unreadCount, setUnreadCount } = useNotificationStore();

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount()
        .then(setUnreadCount)
        .catch(() => {});
    }, [setUnreadCount])
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerInner}>
          <View style={styles.headerTexts}>
            <Text style={styles.greeting}>{greetingText}</Text>
            <Text style={styles.username}>{t('home.usernameFormat', { name })}</Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.7}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.primary[600]} />
            {unreadCount > 0 && <View style={styles.badge} />}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentWrapper}>
        <LinearGradient colors={[colors.primary[200], colors.text.white]} style={styles.gradient} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <TaskCard />
          <ScanBanner />
          <FeatureSection />
          <GuideCards />
          <RecentDocs />
        </ScrollView>
      </View>
    </View>
  );
};

export default HomeScreen;
