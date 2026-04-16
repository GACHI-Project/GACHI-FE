import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import TaskCard from '../../src/components/home/TaskCard';
import ScanBanner from '../../src/components/home/ScanBanner';
import FeatureSection from '../../src/components/home/FeatureSection';
import GuideCards from '../../src/components/home/GuideCards';
import RecentDocs from '../../src/components/home/RecentDocs';
import { GREETINGS } from '../../src/constants/greetings';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/home/homeScreen';

const getGreetingByTime = (): string => {
  const hour = new Date().getHours();

  let currentGreetings: readonly string[];

  if (hour >= 5 && hour < 11) {
    currentGreetings = GREETINGS.morning;
  } else if (hour >= 11 && hour < 14) {
    currentGreetings = GREETINGS.lunch;
  } else if (hour >= 14 && hour < 18) {
    currentGreetings = GREETINGS.afternoon;
  } else if (hour >= 18 && hour < 21) {
    currentGreetings = GREETINGS.evening;
  } else {
    currentGreetings = GREETINGS.night;
  }

  return currentGreetings[Math.floor(Math.random() * currentGreetings.length)];
};

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const greetingText = useMemo(() => getGreetingByTime(), []);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerInner}>
          <View style={styles.headerTexts}>
            <Text style={styles.greeting}>{greetingText}</Text>
            <Text style={styles.username}>김까치 님</Text>
          </View>
          <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
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
