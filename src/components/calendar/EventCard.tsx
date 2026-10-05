import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import colors from '../../constants/colors';
import type { CalendarEvent } from '../../api/calendar';
import calStyles from './styles';
import ChecklistSection from './ChecklistSection';
import { formatEventTime } from '../../utils/calendarEventTime';
import { getCalendarDday } from '../../utils/calendarDday';

interface EventCardProps {
  event: CalendarEvent;
  today: string;
  expanded: boolean;
  isPast: boolean;
  onToggleExpand: () => void;
  onToggleCheck: (checklistId: number) => void;
}

const EventCard = ({
  event,
  today,
  expanded,
  isPast,
  onToggleExpand,
  onToggleCheck,
}: EventCardProps) => {
  const { t } = useTranslation();
  const checklistItems = event.checklists;
  const dDay = getCalendarDday(event.periodStartAt ?? event.startAt, today);
  const timeLabel = formatEventTime(event.periodStartAt ?? event.startAt, event.endAt, {
    allDay: event.allDay,
    endAllDay: event.endAllDay,
    allDayLabel: t('scan.result.saveBottomSheet.fullDay'),
  });
  return (
    <View style={[calStyles.card, isPast && styles.past]}>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[calStyles.cardTitle, styles.title]} numberOfLines={1} ellipsizeMode="tail">
            {event.title}
          </Text>
          <View style={calStyles.cardRight}>
            {!isPast && dDay !== null && dDay >= 0 && (
              <View style={[calStyles.dDayBadge, dDay === 0 && calStyles.dDayBadgeUrgent]}>
                <Text style={[calStyles.dDayText, dDay === 0 && calStyles.dDayTextUrgent]}>
                  D-{dDay}
                </Text>
              </View>
            )}
            {checklistItems.length > 0 && (
              <TouchableOpacity
                onPress={onToggleExpand}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={
                  expanded ? t('calendar.checklist.collapse') : t('calendar.checklist.expand')
                }
                accessibilityState={{ expanded }}
              >
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.gray[300]}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={[calStyles.cardTags, styles.tagsRow]}>
          {event.childName && (
            <View style={[calStyles.tag, calStyles.tagFixed, styles.childTag]}>
              <Text
                style={[calStyles.tagText, styles.childText]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {event.childName}
              </Text>
            </View>
          )}
          <View style={[calStyles.tag, styles.newsletterTag]}>
            <Text style={calStyles.tagText} numberOfLines={1} ellipsizeMode="tail">
              {event.newsletterTitle}
            </Text>
          </View>
          {timeLabel && (
            <View style={styles.timeTag}>
              <Ionicons name="time-outline" size={13} color={colors.text.secondary} />
              <Text
                style={[calStyles.tagText, styles.timeText]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {timeLabel}
              </Text>
            </View>
          )}
        </View>
      </View>

      {expanded && checklistItems.length > 0 && (
        <ChecklistSection
          items={checklistItems}
          calendarColor={event.calendarColor}
          onToggleCheck={onToggleCheck}
        />
      )}
    </View>
  );
};

export default EventCard;

const styles = StyleSheet.create({
  content: {
    padding: 15,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  tagsRow: {
    flexWrap: 'nowrap',
  },
  newsletterTag: {
    flexGrow: 1,
  },
  childTag: {
    flexShrink: 1,
    minWidth: 0,
  },
  childText: {
    flexShrink: 1,
    minWidth: 0,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
    gap: 4,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  timeText: {
    flexShrink: 1,
    minWidth: 0,
  },
  past: {
    opacity: 0.6,
  },
});
