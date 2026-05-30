import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import TaskCard from '../../src/components/home/TaskCard';
import ScanBanner from '../../src/components/home/ScanBanner';
import FeatureSection from '../../src/components/home/FeatureSection';
import GuideCards from '../../src/components/home/GuideCards';
import RecentDocs from '../../src/components/home/RecentDocs';
import i18n from '../../src/i18n';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/home/homeScreen';

const getGreetingByTime = (language: string): string => {
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

  const arr = i18n.t(key, { returnObjects: true, lng: language }) as string[];
  return arr[Math.floor(Math.random() * arr.length)];
};

const HomeScreen = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const insets = useSafeAreaInsets();
  const greetingText = useMemo(
    () => getGreetingByTime(i18nInstance.language),
    [i18nInstance.language]
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerInner}>
          <View style={styles.headerTexts}>
            <Text style={styles.greeting}>{greetingText}</Text>
            <Text style={styles.username}>{t('home.usernameFormat', { name: '김까치' })}</Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.7}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.primary[600]} />
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
