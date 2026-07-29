import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import colors from '../../constants/colors';
import type { CalendarEvent } from '../../api/calendar';
import calStyles from './styles';
import ChecklistSection from './ChecklistSection';

interface EventCardProps {
  event: CalendarEvent;
  expanded: boolean;
  isPast: boolean;
  onToggleExpand: () => void;
  onToggleCheck: (checklistId: number) => void;
}

const EventCard = ({ event, expanded, isPast, onToggleExpand, onToggleCheck }: EventCardProps) => {
  const { t } = useTranslation();
  const checklistItems = event.checklists;

  return (
    <View style={[calStyles.card, isPast && styles.past]}>
      <View style={calStyles.cardHeader}>
        <View style={calStyles.cardLeft}>
          <Text style={calStyles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
            {event.title}
          </Text>
          <View style={calStyles.cardTags}>
            <View style={[calStyles.tag, calStyles.tagFixed]}>
              <Text style={calStyles.tagText}>{event.childName}</Text>
            </View>
            <View style={calStyles.tag}>
              <Text style={calStyles.tagText} numberOfLines={1} ellipsizeMode="tail">
                {event.newsletterTitle}
              </Text>
            </View>
          </View>
        </View>
        <View style={calStyles.cardRight}>
          {!isPast && (
            <View style={[calStyles.dDayBadge, event.dDay === 0 && calStyles.dDayBadgeUrgent]}>
              <Text style={[calStyles.dDayText, event.dDay === 0 && calStyles.dDayTextUrgent]}>
                D-{event.dDay}
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
  past: {
    opacity: 0.6,
  },
});
