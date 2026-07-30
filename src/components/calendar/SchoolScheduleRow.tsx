import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import calStyles from './styles';
import colors from '../../constants/colors';
import type { HolidayItem } from '../../api/calendar';

interface SchoolScheduleRowProps {
  item: HolidayItem;
  type: 'holiday' | 'academic';
  childNames?: string[];
}

const SchoolScheduleRow = ({ item, type, childNames }: SchoolScheduleRowProps) => {
  const { t } = useTranslation();

  const showHolidayTag = type === 'holiday';
  const showChildTags = type === 'academic' && childNames && childNames.length > 0;

  return (
    <View style={calStyles.card}>
      <View style={calStyles.cardHeader}>
        {type === 'holiday' && <Ionicons name="flag" size={20} color={colors.gray[300]} />}
        {type === 'academic' && <Ionicons name="school" size={20} color={colors.gray[300]} />}
        <Text style={[calStyles.cardLeft, calStyles.cardTitle]} numberOfLines={1}>
          {item.eventName}
        </Text>
        {(showHolidayTag || showChildTags) && (
          <View style={calStyles.cardTags}>
            {showHolidayTag && (
              <View style={calStyles.tag}>
                <Text style={calStyles.tagText}>{t('calendar.schoolSchedule.holiday')}</Text>
              </View>
            )}
            {showChildTags &&
              childNames!.map((name) => (
                <View key={name} style={calStyles.tag}>
                  <Text style={calStyles.tagText} numberOfLines={1}>
                    {name}
                  </Text>
                </View>
              ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default SchoolScheduleRow;
