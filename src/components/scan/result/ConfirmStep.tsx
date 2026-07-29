import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PrimaryButton, SecondaryButton } from '../../common/Button';
import EventPreviewCard from './EventPreviewCard';
import type { EventState } from './EventPreviewCard';
import type { CalendarPreviewItem } from '../../../api/calendar';
import styles from './styles';
import colors from '../../../constants/colors';

const STYLE_FLEX_1 = { flex: 1 } as const;
const STYLE_FLEX_2 = { flex: 2 } as const;

interface Props {
  hasAnyMissingDate: boolean;
  previewLoading: boolean;
  previewError: string | null;
  previews: CalendarPreviewItem[];
  eventStates: Record<string, EventState>;
  childName: string;
  registering: boolean;
  canRegister: boolean;
  onUpdate: (id: string, patch: Partial<EventState>) => void;
  onDateConfirm: (id: string) => void;
  getDisplayDate: (y: string, m: string, d: string) => string;
  onClose: () => void;
  onRegister: () => void;
}

const ConfirmStep = ({
  hasAnyMissingDate,
  previewLoading,
  previewError,
  previews,
  eventStates,
  childName,
  registering,
  canRegister,
  onUpdate,
  onDateConfirm,
  getDisplayDate,
  onClose,
  onRegister,
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
          <Text style={styles.title}>{t('scan.result.saveBottomSheet.title')}</Text>
          <Text style={styles.subtitle}>
            {hasAnyMissingDate
              ? t('scan.result.saveBottomSheet.subtitleManualDate')
              : t('scan.result.saveBottomSheet.subtitleAutoDate')}
          </Text>
        </View>

        {hasAnyMissingDate && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={16} color={colors.text.primary} />
            <Text style={styles.warningText}>{t('scan.result.saveBottomSheet.dateNotFound')}</Text>
          </View>
        )}

        {previewLoading && (
          <ActivityIndicator
            size="small"
            color={colors.primary[400]}
            style={localStyles.loadingIndicator}
          />
        )}
        {!previewLoading && previewError && (
          <Text style={localStyles.errorText}>{previewError}</Text>
        )}
        {!previewLoading &&
          !previewError &&
          previews.map((p) => {
            const es = eventStates[p.tempEventId];
            if (!es) return null;
            return (
              <EventPreviewCard
                key={p.tempEventId}
                item={p}
                es={es}
                childName={childName}
                onUpdate={onUpdate}
                onDateConfirm={onDateConfirm}
                getDisplayDate={getDisplayDate}
              />
            );
          })}
      </ScrollView>

      <View style={styles.buttons}>
        <SecondaryButton
          label={t('scan.result.saveBottomSheet.no')}
          onPress={onClose}
          style={STYLE_FLEX_1}
        />
        <PrimaryButton
          label={registering ? '...' : t('scan.result.saveBottomSheet.register')}
          onPress={onRegister}
          disabled={registering || !canRegister}
          style={STYLE_FLEX_2}
        />
      </View>
    </>
  );
};

export default ConfirmStep;

const localStyles = StyleSheet.create({
  scrollArea: { width: '100%', flex: 1 },
  scrollContent: { gap: 20, paddingBottom: 4 },
  loadingIndicator: { marginVertical: 16 },
  errorText: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
