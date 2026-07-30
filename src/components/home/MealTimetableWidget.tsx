import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useChildrenStore } from '../../store/childrenStore';
import {
  fetchSchoolMeals,
  getMealsForChild,
  fetchSchoolTimetables,
  getPeriodsForChild,
} from '../../api/meal';
import type { MealMenu, TimetablePeriod } from '../../api/meal';
import colors from '../../constants/colors';
import styles from './mealTimetableWidget.styles';
import MealCard from './MealCard';
import TimetableCard from './TimetableCard';

const CARD_GAP = 16;
const HORIZONTAL_PADDING = 40;

const getTodayStr = (): string => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const MealTimetableWidget = () => {
  const { t } = useTranslation();
  const childItems = useChildrenStore((s) => s.children);
  const { width: screenWidth, fontScale } = useWindowDimensions();
  const cardWidth = (screenWidth - HORIZONTAL_PADDING - CARD_GAP) / 2;
  const [today, setToday] = useState(getTodayStr);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const timeout = setTimeout(
      () => setToday(getTodayStr()),
      nextMidnight.getTime() - now.getTime()
    );
    return () => clearTimeout(timeout);
  }, [today]);

  const [meals, setMeals] = useState<MealMenu[][]>([]);
  const [timetables, setTimetables] = useState<TimetablePeriod[][]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!childItems.length) return;
    setLoading(true);
    Promise.all([
      fetchSchoolMeals(today, today)
        .then((schoolMeals) =>
          childItems.map((c) => getMealsForChild(schoolMeals, c.officeCode, c.schoolCode, today))
        )
        .catch(() => childItems.map(() => [])),
      fetchSchoolTimetables(today, today)
        .then((schoolTimetables) =>
          childItems.map((c) =>
            getPeriodsForChild(
              schoolTimetables,
              c.officeCode,
              c.schoolCode,
              c.grade,
              c.className ?? null,
              today
            )
          )
        )
        .catch(() => childItems.map(() => [])),
    ])
      .then(([fetchedMeals, fetchedTimetables]) => {
        setMeals(fetchedMeals);
        setTimetables(fetchedTimetables);
      })
      .finally(() => setLoading(false));
  }, [childItems, today]);

  if (!childItems.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('mealTimetable.sectionTitle')}</Text>
        <TouchableOpacity onPress={() => router.push('/meal-timetable')} activeOpacity={0.7}>
          <View style={styles.viewAllRow}>
            <Text style={styles.viewAllText}>{t('mealTimetable.viewAll')}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.text.secondary} />
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.cardsRow}>
        <MealCard
          cardWidth={cardWidth}
          items={childItems}
          meals={meals}
          loading={loading}
          fontScale={fontScale}
        />
        <TimetableCard
          cardWidth={cardWidth}
          items={childItems}
          timetables={timetables}
          loading={loading}
          fontScale={fontScale}
        />
      </View>
    </View>
  );
};

export default MealTimetableWidget;
