import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import type { CalendarEvent } from '../../api/calendar';
import calStyles from './styles';
import colors from '../../constants/colors';

interface Props {
  items: CalendarEvent['checklists'];
  calendarColor: string;
  onToggleCheck: (checklistId: number) => void;
}

const ChecklistSection = ({ items, calendarColor, onToggleCheck }: Props) => (
  <View style={[calStyles.checklistWrap, { backgroundColor: `${calendarColor}26` }]}>
    {items.map((item) => (
      <TouchableOpacity
        key={item.checklistId}
        style={calStyles.checkItem}
        onPress={() => onToggleCheck(item.checklistId)}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityLabel={item.content}
        accessibilityState={{ checked: item.isCompleted }}
      >
        <View
          style={[
            calStyles.checkbox,
            { borderColor: calendarColor },
            item.isCompleted && { backgroundColor: calendarColor },
          ]}
        >
          {item.isCompleted && <FontAwesome name="check" size={10} color={colors.text.white} />}
        </View>
        <Text style={[calStyles.checkText, item.isCompleted && calStyles.checkTextDone]}>
          {item.content}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default ChecklistSection;
