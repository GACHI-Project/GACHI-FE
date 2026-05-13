import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

interface WeekCalendarProps {
  weekDates: string[];
  today: string;
  markedDates: Record<string, { dots?: { key: string; color: string }[] }>;
  onPrev: () => void;
  onNext: () => void;
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const formatMonthDay = (dateStr: string) => {
  const [, month, day] = dateStr.split('-').map(Number);
  return `${month}월 ${day}일`;
};

const WeekCalendar = ({ weekDates, today, markedDates, onPrev, onNext }: WeekCalendarProps) => (
  <View style={styles.container}>
    {/* 날짜 범위 헤더 */}
    <View style={styles.rangeHeader}>
      <TouchableOpacity
        onPress={onPrev}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="이전 주"
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
        accessibilityLabel="다음 주"
      >
        <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
      </TouchableOpacity>
    </View>

    {/* 요일 + 날짜 + dot */}
    <View style={styles.datesRow}>
      {weekDates.map((dateStr, index) => {
        const day = parseInt(dateStr.split('-')[2], 10);
        const isToday = dateStr === today;
        const dots = markedDates[dateStr]?.dots ?? [];

        return (
          <View key={dateStr} style={styles.dayCell}>
            <Text style={styles.dayName}>{DAY_NAMES[index]}</Text>
            <View style={[styles.dateCircle, isToday && styles.todayCircle]}>
              <Text style={[styles.dateText, isToday && styles.todayText]}>{day}</Text>
            </View>
            <View style={styles.dotsRow}>
              {dots.slice(0, 3).map((dot) => (
                <View key={dot.key} style={[styles.dot, { backgroundColor: dot.color }]} />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  </View>
);

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
    gap: 2,
    height: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
