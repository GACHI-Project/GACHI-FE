import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import WeekCalendar from './WeekCalendar';
import EventCard from './EventCard';
import SchoolScheduleRow from './SchoolScheduleRow';
import type { WeekDisplayGroup, SchoolDisplayEntry } from '../../hooks/calendar/useCalendarEvents';
import type { CalendarEvent } from '../../api/calendar';
import colors from '../../constants/colors';
import styles from './styles';

const formatWeekDateHeader = (dateStr: string, locale: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(year, month - 1, day));
};

interface Props {
  scrollRef: React.RefObject<ScrollView>;
  weekDates: string[];
  today: string;
  weekMarkedDates: Record<string, { dots: { key: string; color: string }[] }>;
  isLoading: boolean;
  weekDisplayGroups: WeekDisplayGroup[];
  expandedIds: Set<number>;
  weekOffsetRef: React.MutableRefObject<number>;
  shouldAutoScrollRef: React.MutableRefObject<boolean>;
  todayGroupY: React.MutableRefObject<number | undefined>;
  onWeekPrev: () => void;
  onWeekNext: () => void;
  onScroll: (event: { nativeEvent: { contentOffset: { y: number } } }) => void;
  onToggleExpand: (id: number) => void;
  onToggleCheck: (eventId: number, checklistId: number) => void;
}

const WeekViewContent = ({
  scrollRef,
  weekDates,
  today,
  weekMarkedDates,
  isLoading,
  weekDisplayGroups,
  expandedIds,
  weekOffsetRef,
  shouldAutoScrollRef,
  todayGroupY,
  onWeekPrev,
  onWeekNext,
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
      onContentSizeChange={() => {
        if (weekOffsetRef.current !== 0 || !shouldAutoScrollRef.current) return;
        requestAnimationFrame(() => {
          if (weekOffsetRef.current !== 0 || todayGroupY.current === undefined) return;
          scrollRef.current?.scrollTo({ y: todayGroupY.current, animated: false });
          // eslint-disable-next-line no-param-reassign
          shouldAutoScrollRef.current = false;
        });
      }}
    >
      <WeekCalendar
        weekDates={weekDates}
        today={today}
        markedDates={weekMarkedDates}
        onPrev={onWeekPrev}
        onNext={onWeekNext}
      />

      {isLoading ? (
        <View style={styles.loadingContainerInline}>
          <ActivityIndicator size="large" color={colors.primary[400]} />
        </View>
      ) : (
        <View style={styles.weekListContent}>
          {weekDisplayGroups.length === 0 ? (
            <Text style={styles.emptyText}>{t('calendar.emptyWeek')}</Text>
          ) : (
            weekDisplayGroups.map((group) => (
              <View
                key={group.date}
                onLayout={(e) => {
                  if (group.date === today) {
                    // eslint-disable-next-line no-param-reassign
                    todayGroupY.current = e.nativeEvent.layout.y;
                  }
                }}
              >
                <Text style={styles.weekDateHeader}>
                  {formatWeekDateHeader(group.date, i18n.language)}
                </Text>
                <View style={styles.cardGroup}>
                  {group.schoolSchedules.map((entry: SchoolDisplayEntry) => (
                    <SchoolScheduleRow
                      key={`${entry.item.date}-${entry.item.eventName}-${entry.schoolGroupKey ?? entry.type}`}
                      item={entry.item}
                      type={entry.type}
                      childNames={entry.childNames}
                    />
                  ))}
                  {group.events.map((event: CalendarEvent) => (
                    <EventCard
                      key={event.eventId}
                      event={event}
                      expanded={expandedIds.has(event.eventId)}
                      isPast={group.date < today}
                      onToggleExpand={() => onToggleExpand(event.eventId)}
                      onToggleCheck={(checklistId) => onToggleCheck(event.eventId, checklistId)}
                    />
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
};

export default WeekViewContent;
