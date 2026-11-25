import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { getMealsForChild, getPeriodsForChild } from '../../api/meal';
import colors from '../../constants/colors';
import useCurrentDate from '../../hooks/useCurrentDate';
import { useChildrenQuery, useMealsQuery, useTimetablesQuery } from '../../query/resources';
import MealCard from './MealCard';
import styles from './mealTimetableWidget.styles';
import TimetableCard from './TimetableCard';

const CARD_GAP = 16;
const HORIZONTAL_PADDING = 40;

const MealTimetableWidget = () => {
  const { t } = useTranslation();
  const { data: childItems = [] } = useChildrenQuery();
  const { width: screenWidth, fontScale } = useWindowDimensions();
  const [cardsWidth, setCardsWidth] = useState<number | null>(null);
  const cardWidth = Math.max(0, ((cardsWidth ?? screenWidth - HORIZONTAL_PADDING) - CARD_GAP) / 2);
  const today = useCurrentDate();
  const mealQuery = useMealsQuery(today, today, !!childItems.length);
  const timetableQuery = useTimetablesQuery(today, today, !!childItems.length);
  const meals = childItems.map((child) =>
    getMealsForChild(mealQuery.data ?? [], child.officeCode, child.schoolCode, today)
  );
  const timetables = childItems.map((child) =>
    getPeriodsForChild(
      timetableQuery.data ?? [],
      child.officeCode,
      child.schoolCode,
      child.grade,
      child.className ?? null,
      today
    )
  );
  const loading = mealQuery.isLoading || timetableQuery.isLoading;

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
      <View
        style={styles.cardsRow}
        onLayout={(event) => setCardsWidth(event.nativeEvent.layout.width)}
      >
        <MealCard
          cardWidth={cardWidth}
          items={childItems}
          meals={meals}
          error={mealQuery.isError}
          loading={loading}
          fontScale={fontScale}
        />
        <TimetableCard
          cardWidth={cardWidth}
          items={childItems}
          timetables={timetables}
          error={timetableQuery.isError}
          loading={loading}
          fontScale={fontScale}
        />
      </View>
    </View>
  );
};

export default MealTimetableWidget;
