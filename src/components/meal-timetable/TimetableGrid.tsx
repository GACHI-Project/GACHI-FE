import { View, Text, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { isToday, fmt } from '../../utils/date';
import type { TimetableDay } from '../../hooks/meal/useMealTimetable';
import colors from '../../constants/colors';
import layout from '../../constants/layout';
import styles from './styles';

const PERIOD_COL_W = 40;

interface Props {
  loading: boolean;
  timetableByDay: TimetableDay[];
  periodCount: number;
}

const TimetableGrid = ({ loading, timetableByDay, periodCount }: Props) => {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const dayLabels = t('mealTimetable.dayLabels', { returnObjects: true }) as string[];
  const dayColW = (screenWidth - layout.screenPaddingHorizontal * 2 - PERIOD_COL_W) / 5;

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.primary[400]} />
      </View>
    );
  }

  return (
    <View style={styles.tableWrap}>
      <View style={styles.tableHeaderRow}>
        <View style={[styles.tablePeriodCell, { width: PERIOD_COL_W }]} />
        {timetableByDay.map((day) => (
          <View
            key={fmt(day.date)}
            style={[
              styles.tableDayHeader,
              { width: dayColW },
              isToday(day.date) && styles.todayHeaderCol,
            ]}
          >
            <Text style={[styles.tableDayDate, isToday(day.date) && styles.todayText]}>
              {day.date.getMonth() + 1}/{day.date.getDate()}
            </Text>
            <Text style={[styles.tableDayName, isToday(day.date) && styles.todayText]}>
              {dayLabels[day.date.getDay()]}
            </Text>
          </View>
        ))}
      </View>

      {Array.from({ length: periodCount }, (_, i) => i + 1).map((period) => (
        <View key={period} style={[styles.tableRow, period % 2 === 0 && styles.tableRowEven]}>
          <View style={[styles.tablePeriodCell, { width: PERIOD_COL_W }]}>
            <Text style={styles.tablePeriodText}>{period}</Text>
          </View>
          {timetableByDay.map((day) => {
            const p = day.periods.find((pp) => pp.period === period);
            return (
              <View
                key={fmt(day.date)}
                style={[
                  styles.tableCell,
                  { width: dayColW },
                  isToday(day.date) && styles.todayCell,
                ]}
              >
                <Text style={styles.tableCellText} numberOfLines={2}>
                  {p?.subject ?? ''}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

export default TimetableGrid;
