import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

interface MonthCalendarProps {
  year: number;
  month: number;
  today: string;
  selectedDate: string;
  markedDates: Record<string, { dots?: { key: string; color: string }[] }>;
  onDayPress: (dateStr: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const REF_SUNDAY = new Date(2024, 0, 7);

const toDateStr = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const MonthCalendar = ({
  year,
  month,
  today,
  selectedDate,
  markedDates,
  onDayPress,
  onPrevMonth,
  onNextMonth,
}: MonthCalendarProps) => {
  const { t, i18n } = useTranslation();

  const dayNames = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(
      new Date(REF_SUNDAY.getFullYear(), REF_SUNDAY.getMonth(), REF_SUNDAY.getDate() + i)
    )
  );

  const monthLabel = new Intl.DateTimeFormat(i18n.language, { year: 'numeric', month: 'long' }).format(
    new Date(year, month, 1)
  );

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const prevLastDate = new Date(year, month, 0).getDate();

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  const prevCells = Array.from({ length: firstDayOfWeek }, (_, i) => ({
    dateStr: toDateStr(prevYear, prevMonth, prevLastDate - (firstDayOfWeek - 1 - i)),
    inMonth: false,
  }));

  const currCells = Array.from({ length: lastDate }, (_, i) => ({
    dateStr: toDateStr(year, month, i + 1),
    inMonth: true,
  }));

  const totalRows = Math.ceil((firstDayOfWeek + lastDate) / 7);
  const totalCells = totalRows * 7;
  const nextCount = totalCells - firstDayOfWeek - lastDate;

  const nextCells = Array.from({ length: nextCount }, (_, i) => ({
    dateStr: toDateStr(nextYear, nextMonth, i + 1),
    inMonth: false,
  }));

  const cells = [...prevCells, ...currCells, ...nextCells];

  const weeks = Array.from({ length: totalRows }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onPrevMonth}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('calendar.prevMonth')}
        >
          <Ionicons name="chevron-back" size={16} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerText}>{monthLabel}</Text>
        <TouchableOpacity
          onPress={onNextMonth}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('calendar.nextMonth')}
        >
          <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {dayNames.map((name) => (
          <View key={name} style={styles.dayCell}>
            <Text style={styles.dayName}>{name}</Text>
          </View>
        ))}
      </View>

      {weeks.map((week) => (
        <View key={week[0].dateStr} style={styles.weekRow}>
          {week.map(({ dateStr, inMonth }) => {
            const day = parseInt(dateStr.split('-')[2], 10);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate && !isToday;
            const dots = markedDates[dateStr]?.dots ?? [];
            return (
              <TouchableOpacity
                key={dateStr}
                style={styles.dayCell}
                onPress={() => inMonth && onDayPress(dateStr)}
                activeOpacity={inMonth ? 0.7 : 1}
              >
                <View
                  style={[
                    styles.dateCircle,
                    isToday && styles.todayCircle,
                    isSelected && styles.selectedCircle,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateText,
                      !inMonth && styles.outsideText,
                      isToday && styles.todayText,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                <View style={styles.dotsRow}>
                  {dots.slice(0, 4).map((dot) => (
                    <View key={dot.key} style={[styles.dot, { backgroundColor: dot.color }]} />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

export default MonthCalendar;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.text.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  headerText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#1A1A1A',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
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
  selectedCircle: {
    backgroundColor: colors.gray[200],
    borderRadius: 16,
  },
  dateText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.primary,
  },
  todayText: {
    color: colors.text.white,
  },
  outsideText: {
    color: colors.gray[200],
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
    height: 4,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
