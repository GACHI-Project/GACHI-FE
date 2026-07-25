import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

interface WeekCalendarProps {
  weekDates: string[];
  today: string;
  markedDates: Record<string, { dots?: { key: string; color: string }[] }>;
  onPrev: () => void;
  onNext: () => void;
}

const REF_SUNDAY = new Date(2024, 0, 7);

const WeekCalendar = ({ weekDates, today, markedDates, onPrev, onNext }: WeekCalendarProps) => {
  const { t, i18n } = useTranslation();

  const dayNames = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' }).format(
      new Date(REF_SUNDAY.getFullYear(), REF_SUNDAY.getMonth(), REF_SUNDAY.getDate() + i)
    )
  );

  const formatMonthDay = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Intl.DateTimeFormat(i18n.language, { month: 'long', day: 'numeric' }).format(
      new Date(year, month - 1, day)
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.rangeHeader}>
        <TouchableOpacity
          onPress={onPrev}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('calendar.prevWeek')}
        >
          <Ionicons name="chevron-back" size={16} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.rangeText}>
          {formatMonthDay(weekDates[0])} ~ {formatMonthDay(weekDates[6])}
        </Text>
        <TouchableOpacity
          onPress={onNext}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('calendar.nextWeek')}
        >
          <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.datesRow}>
        {weekDates.map((dateStr, index) => {
          const day = parseInt(dateStr.split('-')[2], 10);
          const isToday = dateStr === today;
          const dots = markedDates[dateStr]?.dots ?? [];

          return (
            <View key={dateStr} style={styles.dayCell}>
              <Text style={styles.dayName} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                {dayNames[index]}
              </Text>
              <View style={[styles.dateCircle, isToday && styles.todayCircle]}>
                <Text
                  style={[styles.dateText, isToday && styles.todayText]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.2}
                >
                  {day}
                </Text>
              </View>
              <View style={styles.dotsRow}>
                {dots.slice(0, 4).map((dot) => (
                  <View key={dot.key} style={[styles.dot, { backgroundColor: dot.color }]} />
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default WeekCalendar;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.text.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  rangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginHorizontal: 16,
  },
  rangeText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#1A1A1A',
  },
  datesRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dayName: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#888888',
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    backgroundColor: colors.primary[500],
  },
  dateText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.primary,
  },
  todayText: {
    color: colors.text.white,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
    height: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
