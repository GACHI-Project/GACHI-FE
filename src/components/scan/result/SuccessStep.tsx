import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PrimaryButton, SecondaryButton } from '../../common/Button';
import type { EventState } from './EventPreviewCard';
import type { CalendarPreviewItem } from '../../../api/calendar';
import styles from './styles';
import colors from '../../../constants/colors';

const STYLE_FULL_WIDTH = { width: '100%' } as const;

interface Props {
  previews: CalendarPreviewItem[];
  eventStates: Record<string, EventState>;
  childName: string;
  getDisplayDate: (y: string, m: string, d: string) => string;
  onConfirm: () => void;
  onDismiss: () => void;
}

const SuccessStep = ({
  previews,
  eventStates,
  childName,
  getDisplayDate,
  onConfirm,
  onDismiss,
}: Props) => {
  const { t } = useTranslation();
  return (
    <>
      <ScrollView
        style={localStyles.scrollArea}
        contentContainerStyle={localStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconWrap}>
          <Ionicons name="calendar-outline" size={28} color={colors.primary[400]} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{t('scan.result.saveBottomSheet.successTitle')}</Text>
          <Text style={styles.subtitle}>{t('scan.result.saveBottomSheet.successSubtitle')}</Text>
        </View>
        {previews.map((p) => {
          const es = eventStates[p.tempEventId];
          return (
            <View key={p.tempEventId} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <View style={styles.eventDot} />
                <View style={styles.successEventInfo}>
                  <Text style={styles.eventTitle}>
                    {p.title} · {childName}
                  </Text>
                  {es && (
                    <Text style={styles.eventDate}>
                      {getDisplayDate(es.year, es.month, es.day)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <PrimaryButton
        label={t('scan.result.saveBottomSheet.viewCalendar')}
        onPress={onConfirm}
        style={STYLE_FULL_WIDTH}
      />
      <SecondaryButton
        label={t('scan.result.saveBottomSheet.close')}
        onPress={onDismiss}
        style={STYLE_FULL_WIDTH}
      />
    </>
  );
};

export default SuccessStep;

const localStyles = StyleSheet.create({
  scrollArea: { width: '100%', flex: 1 },
  scrollContent: { gap: 20, paddingBottom: 4 },
});
