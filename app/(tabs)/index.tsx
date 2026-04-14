import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import TaskCard from '../../src/components/home/TaskCard';
import ScanBanner from '../../src/components/home/ScanBanner';
import FeatureSection from '../../src/components/home/FeatureSection';
import { GREETINGS } from '../../src/constants/greetings';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/home/homeScreen';

const HomeScreen = () => {
  const insets = useSafeAreaInsets();

  const getGreetingByTime = () => {
    const hour = new Date().getHours();

    const greetings = GREETINGS;

    let currentGreetings: readonly string[] = greetings.morning;

    if (hour >= 5 && hour < 11) {
      currentGreetings = greetings.morning;
    } else if (hour >= 11 && hour < 14) {
      currentGreetings = greetings.lunch;
    } else if (hour >= 14 && hour < 18) {
      currentGreetings = greetings.afternoon;
    } else if (hour >= 18 && hour < 21) {
      currentGreetings = greetings.evening;
    } else {
      currentGreetings = greetings.night;
    }

    const randomIndex = Math.floor(Math.random() * currentGreetings.length);
    return currentGreetings[randomIndex];
  };

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
        </ScrollView>
      </View>
    </View>
  );
};

export default HomeScreen;
