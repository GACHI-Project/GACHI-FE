import { View, Text, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { isToday, fmt } from '../../utils/date';
import type { MealDay } from '../../hooks/meal/useMealTimetable';
import colors from '../../constants/colors';
import styles from './styles';

interface Props {
  loading: boolean;
  mealsByDay: MealDay[];
}

const MealTimeline = ({ loading, mealsByDay }: Props) => {
  const { t } = useTranslation();
  const dayLabels = t('mealTimetable.dayLabels', { returnObjects: true }) as string[];

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.primary[400]} />
      </View>
    );
  }

  return (
    <View style={styles.timeline}>
      {mealsByDay.map((day, i) => (
        <View key={fmt(day.date)} style={styles.timelineItem}>
          <View style={styles.timelineLeft}>
            <View style={[styles.timelineDot, isToday(day.date) && styles.timelineDotActive]} />
            {i < mealsByDay.length - 1 && <View style={styles.timelineLine} />}
          </View>
          <View style={styles.timelineRight}>
            <View style={styles.timelineDateRow}>
              <Text
                style={[styles.timelineDateText, isToday(day.date) && styles.timelineDateTextToday]}
              >
                {day.date.getMonth() + 1}.{day.date.getDate()}.{dayLabels[day.date.getDay()]},{' '}
                {t('mealTimetable.lunch')}
              </Text>
              {isToday(day.date) && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>{t('common.today')}</Text>
                </View>
              )}
            </View>
            <View style={styles.mealCard}>
              {day.menus.length > 0 ? (
                day.menus.map((menu) => (
                  <View key={`${fmt(day.date)}-${menu.name}`} style={styles.mealItem}>
                    <View style={styles.mealBullet} />
                    <Text style={styles.mealName}>
                      {menu.name}
                      {menu.allergyNums.length > 0 && (
                        <Text style={styles.mealAllergyText}> ({menu.allergyNums.join('.')})</Text>
                      )}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noMealText}>{t('mealTimetable.meal.empty')}</Text>
              )}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

export default MealTimeline;
