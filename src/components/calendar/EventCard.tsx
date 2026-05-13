import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import colors from '../../constants/colors';
import type { CalendarEvent } from '../../mock/calendar';
import calStyles from '../../styles/calendar/calendar';

interface EventCardProps {
  event: CalendarEvent;
  expanded: boolean;
  isPast: boolean;
  onToggleExpand: () => void;
  onToggleCheck: (checkId: string) => void;
}

const calcDDay = (dateStr: string): number => {
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  return Math.round((target.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
};

const EventCard = ({ event, expanded, isPast, onToggleExpand, onToggleCheck }: EventCardProps) => {
  const dDay = calcDDay(event.date);

  return (
    <View style={[calStyles.card, isPast && styles.past]}>
      <View style={calStyles.cardHeader}>
        <View style={calStyles.cardLeft}>
          <Text style={calStyles.cardTitle}>{event.title}</Text>
          <View style={calStyles.cardTags}>
            <View style={calStyles.tag}>
              <Text style={calStyles.tagText}>{event.childName}</Text>
            </View>
            <View style={calStyles.tag}>
              <Text style={calStyles.tagText} numberOfLines={1}>
                {event.documentTitle}
              </Text>
            </View>
          </View>
        </View>
        <View style={calStyles.cardRight}>
          {!isPast && (
            <View style={[calStyles.dDayBadge, dDay === 0 && calStyles.dDayBadgeUrgent]}>
              <Text style={[calStyles.dDayText, dDay === 0 && calStyles.dDayTextUrgent]}>
                D-{dDay}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={onToggleExpand}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={expanded ? '체크리스트 접기' : '체크리스트 펼치기'}
            accessibilityState={{ expanded }}
          >
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.gray[300]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {expanded && (
        <View style={[calStyles.checklistWrap, { backgroundColor: `${event.calendarColor}26` }]}>
          {event.checkList.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={calStyles.checkItem}
              onPress={() => onToggleCheck(item.id)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityLabel={item.label}
              accessibilityState={{ checked: item.done }}
            >
              <View
                style={[
                  calStyles.checkbox,
                  { borderColor: event.calendarColor },
                  item.done && { backgroundColor: event.calendarColor },
                ]}
              >
                {item.done && <FontAwesome name="check" size={10} color={colors.text.white} />}
              </View>
              <Text style={[calStyles.checkText, item.done && calStyles.checkTextDone]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
