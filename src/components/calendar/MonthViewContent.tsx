import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import MonthCalendar from './MonthCalendar';
import EventCard from './EventCard';
import SchoolScheduleRow from './SchoolScheduleRow';
import type { SchoolDisplayEntry } from '../../hooks/calendar/useCalendarEvents';
import type { CalendarEvent } from '../../api/calendar';
import colors from '../../constants/colors';
import styles from './styles';

const formatDayLabel = (dateStr: string, locale: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(
    new Date(year, month - 1, day)
  );
};

interface Props {
  scrollRef: React.RefObject<ScrollView>;
  calendarMonth: { year: number; month: number };
  today: string;
  selectedDate: string;
  markedDatesMap: Record<string, { dots: { key: string; color: string }[] }>;
  isLoading: boolean;
  isDailyLoading: boolean;
  dayEvents: CalendarEvent[];
  daySchoolSchedules: SchoolDisplayEntry[];
  expandedIds: Set<number>;
  onDayPress: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onScroll: (event: { nativeEvent: { contentOffset: { y: number } } }) => void;
  onToggleExpand: (id: number) => void;
  onToggleCheck: (eventId: number, checklistId: number) => void;
}

const MonthViewContent = ({
  scrollRef,
  calendarMonth,
  today,
  selectedDate,
  markedDatesMap,
  isLoading,
  isDailyLoading,
  dayEvents,
  daySchoolSchedules,
  expandedIds,
  onDayPress,
  onPrevMonth,
  onNextMonth,
  onScroll,
  onToggleExpand,
  onToggleCheck,
}: Props) => {
  const { t, i18n } = useTranslation();
  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scrollArea}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={100}
    >
      <MonthCalendar
        year={calendarMonth.year}
        month={calendarMonth.month}
        today={today}
        selectedDate={selectedDate}
        markedDates={markedDatesMap}
        onDayPress={onDayPress}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />

      <Text style={styles.dayLabel}>{formatDayLabel(selectedDate, i18n.language)}</Text>
      {isLoading ? (
        <View style={styles.loadingContainerInline}>
          <ActivityIndicator size="large" color={colors.primary[400]} />
        </View>
      ) : (
        <View style={styles.listContent}>
          {isDailyLoading && <ActivityIndicator size="small" color={colors.primary[400]} />}
          {!isDailyLoading && daySchoolSchedules.length === 0 && dayEvents.length === 0 && (
            <Text style={styles.emptyText}>{t('calendar.emptyDay')}</Text>
          )}
          {!isDailyLoading &&
            daySchoolSchedules.map((entry: SchoolDisplayEntry) => (
              <SchoolScheduleRow
                key={`${entry.item.date}-${entry.item.eventName}-${entry.schoolGroupKey ?? entry.type}`}
                item={entry.item}
                type={entry.type}
                childNames={entry.childNames}
              />
            ))}
          {!isDailyLoading &&
            dayEvents.map((event: CalendarEvent) => (
              <EventCard
                key={event.eventId}
                event={event}
                expanded={expandedIds.has(event.eventId)}
                isPast={selectedDate < today}
                onToggleExpand={() => onToggleExpand(event.eventId)}
                onToggleCheck={(checklistId) => onToggleCheck(event.eventId, checklistId)}
              />
            ))}
        </View>
      )}
    </ScrollView>
  );
};

export default MonthViewContent;
