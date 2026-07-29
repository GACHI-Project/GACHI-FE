import { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CalendarPreviewItem } from '../../../api/calendar';
import styles from './styles';
import DateInputFields from './DateInputFields';

export type EventState = {
  year: string;
  month: string;
  day: string;
  isEditing: boolean;
};

interface Props {
  item: CalendarPreviewItem;
  es: EventState;
  childName: string;
  onUpdate: (id: string, patch: Partial<EventState>) => void;
  onDateConfirm: (id: string) => void;
  getDisplayDate: (y: string, m: string, d: string) => string;
}

const EventPreviewCard = memo(
  ({ item, es, childName, onUpdate, onDateConfirm, getDisplayDate }: Props) => {
    const { t } = useTranslation();
    const displayDate = getDisplayDate(es.year, es.month, es.day);

    const handleEditToggle = useCallback(
      () => onUpdate(item.tempEventId, { isEditing: !es.isEditing }),
      [onUpdate, item.tempEventId, es.isEditing]
    );
    const handleConfirm = useCallback(
      () => onDateConfirm(item.tempEventId),
      [onDateConfirm, item.tempEventId]
    );
    const handleYearChange = useCallback(
      (v: string) => onUpdate(item.tempEventId, { year: v }),
      [onUpdate, item.tempEventId]
    );
    const handleMonthChange = useCallback(
      (v: string) => onUpdate(item.tempEventId, { month: v }),
      [onUpdate, item.tempEventId]
    );
    const handleDayChange = useCallback(
      (v: string) => onUpdate(item.tempEventId, { day: v }),
      [onUpdate, item.tempEventId]
    );

    return (
      <View style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={styles.eventDot} />
          <Text style={styles.eventTitle}>
            {item.title} · {childName}
          </Text>
        </View>
        {item.isDateExtracted ? (
          <View style={styles.eventDateRow}>
            <Text style={styles.eventDate}>{displayDate}</Text>
            <TouchableOpacity
              style={styles.editBadge}
              onPress={handleEditToggle}
              accessibilityRole="button"
              accessibilityLabel={t('scan.result.saveBottomSheet.accessibilityEdit')}
            >
              <Text style={styles.editBadgeText}>
                {es.isEditing
                  ? t('scan.result.saveBottomSheet.isEditing')
                  : t('scan.result.saveBottomSheet.edit')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.divider} />
            <DateInputFields
              year={es.year}
              month={es.month}
              day={es.day}
              onYearChange={handleYearChange}
              onMonthChange={handleMonthChange}
              onDayChange={handleDayChange}
            />
          </>
        )}
        {item.isDateExtracted && es.isEditing && (
          <View style={styles.dateEditorCard}>
            <Text style={styles.dateEditorLabel}>
              {t('scan.result.saveBottomSheet.dateEditor')}
            </Text>
            <DateInputFields
              year={es.year}
              month={es.month}
              day={es.day}
              onYearChange={handleYearChange}
              onMonthChange={handleMonthChange}
              onDayChange={handleDayChange}
            />
            <TouchableOpacity
              style={styles.dateConfirmBtn}
              onPress={handleConfirm}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('scan.result.saveBottomSheet.accessibilityDateConfirm')}
            >
              <Text style={styles.dateConfirmBtnText}>
                {t('scan.result.saveBottomSheet.dateConfirm')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
);

export default EventPreviewCard;
