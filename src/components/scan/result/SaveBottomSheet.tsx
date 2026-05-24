import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  StyleSheet,
  Keyboard,
  ScrollView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';
import { PrimaryButton, SecondaryButton } from '../../common/Button';
import styles from '../../../styles/scan/saveBottomSheet';
import colors from '../../../constants/colors';
import {
  getCalendarPreview,
  postCalendarEvents,
  injectCalendarPreviewDummy,
  CalendarApiError,
} from '../../../api/calendar';
import type { CalendarPreviewItem } from '../../../api/calendar';
import { getNewsletterTranslation } from '../../../api/newsletter';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDismiss: () => void;
  childName: string;
  newsletterId?: number;
  newsletterTitle?: string;
}

type EventState = {
  year: string;
  month: string;
  day: string;
  isEditing: boolean;
};

interface DateInputFieldsProps {
  year: string;
  month: string;
  day: string;
  onYearChange: (v: string) => void;
  onMonthChange: (v: string) => void;
  onDayChange: (v: string) => void;
}

interface EventCardProps {
  item: CalendarPreviewItem;
  es: EventState;
  childName: string;
  onUpdate: (id: string, patch: Partial<EventState>) => void;
  onDateConfirm: (id: string) => void;
  getDisplayDate: (y: string, m: string, d: string) => string;
}

const SHEET_HEIGHT = 560;
const WINDOW_HEIGHT = Dimensions.get('window').height;
const returnTrue = () => true;
const STYLE_FULL_WIDTH = { width: '100%' } as const;
const STYLE_FLEX_1 = { flex: 1 } as const;
const STYLE_FLEX_2 = { flex: 2 } as const;

const localStyles = StyleSheet.create({
  scrollArea: { width: '100%', flexShrink: 1 },
  scrollContent: { gap: 12 },
  loadingIndicator: { marginVertical: 16 },
  errorText: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
});

const formatCorrectedDate = (y: string, m: string, d: string): string | null => {
  const yn = Number(y);
  const mn = Number(m);
  const dn = Number(d);
  if (!y || !m || !d || Number.isNaN(yn) || Number.isNaN(mn) || Number.isNaN(dn)) return null;
  const date = new Date(yn, mn - 1, dn);
  if (Number.isNaN(date.getTime()) || date.getMonth() !== mn - 1) return null;
  return `${String(yn).padStart(4, '0')}-${String(mn).padStart(2, '0')}-${String(dn).padStart(2, '0')}`;
};

const mapRegisterError = (e: unknown): string => {
  if (e instanceof CalendarApiError) {
    if (e.code === 'COMMON4001') return i18n.t('scan.result.saveBottomSheet.error.invalidInput');
    if (e.code === 'NL4041') return i18n.t('scan.result.saveBottomSheet.error.newsletterNotFound');
  }
  return i18n.t('scan.result.saveBottomSheet.error.registerDefault');
};

const DateInputFields = memo(({
  year,
  month,
  day,
  onYearChange,
  onMonthChange,
  onDayChange,
}: DateInputFieldsProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.dateInputRow}>
      <View style={styles.dateInputWrap}>
        <TextInput
          style={styles.dateInput}
          value={year}
          onChangeText={onYearChange}
          keyboardType="number-pad"
          maxLength={4}
          accessibilityLabel={t('scan.result.saveBottomSheet.yearLabel')}
        />
        <Text style={styles.dateUnit}>{t('scan.result.saveBottomSheet.year')}</Text>
      </View>
      <View style={styles.dateInputWrap}>
        <TextInput
          style={styles.dateInput}
          value={month}
          onChangeText={onMonthChange}
          keyboardType="number-pad"
          maxLength={2}
          accessibilityLabel={t('scan.result.saveBottomSheet.monthLabel')}
        />
        <Text style={styles.dateUnit}>{t('scan.result.saveBottomSheet.month')}</Text>
      </View>
      <View style={styles.dateInputWrap}>
        <TextInput
          style={styles.dateInput}
          value={day}
          onChangeText={onDayChange}
          keyboardType="number-pad"
          maxLength={2}
          accessibilityLabel={t('scan.result.saveBottomSheet.dayLabel')}
        />
        <Text style={styles.dateUnit}>{t('scan.result.saveBottomSheet.day')}</Text>
      </View>
    </View>
  );
});

const EventCard = memo(({
  item,
  es,
  childName,
  onUpdate,
  onDateConfirm,
  getDisplayDate,
}: EventCardProps) => {
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
        <Text style={styles.eventTitle}>{item.title} · {childName}</Text>
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
});

const SaveBottomSheet = ({
  visible,
  onClose,
  onConfirm,
  onDismiss,
  childName,
  newsletterId,
  newsletterTitle,
}: Props) => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  const [show, setShow] = useState(false);
  const [step, setStep] = useState<'confirm' | 'success'>('confirm');
  const [previews, setPreviews] = useState<CalendarPreviewItem[]>([]);
  const [eventStates, setEventStates] = useState<Record<string, EventState>>({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  const updateEventState = useCallback(
    (id: string, patch: Partial<EventState>) =>
      setEventStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } })),
    []
  );

  const newsletterTitleRef = useRef(newsletterTitle);
  useEffect(() => { newsletterTitleRef.current = newsletterTitle; }, [newsletterTitle]);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const combinedY = useRef(Animated.add(translateY, keyboardOffset)).current;

  const animatedTransformStyle = useRef({ transform: [{ translateY: combinedY }] }).current;

  const sheetStyle = useMemo(
    () => [styles.sheet, { paddingBottom: insets.bottom + 20, maxHeight: WINDOW_HEIGHT * 0.75 }],
    [insets.bottom]
  );

  const hasAnyMissingDate = previews.some((p) => !p.isDateExtracted);

  const getDisplayDate = useCallback(
    (y: string, m: string, d: string) => {
      if (!y || !m || !d) return '';
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      if (Number.isNaN(date.getTime())) return '';
      const dateStr = new Intl.DateTimeFormat(i18n.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }).format(date);
      return `${dateStr} · ${t('scan.result.saveBottomSheet.fullDay')}`;
    },
    [i18n.language, t]
  );

  // 미리보기 데이터 fetch (임시: AI 파이프라인 연결 전 더미 주입 후 preview 조회)
  useEffect(() => {
    if (!visible || !newsletterId) return () => {};
    let cancelled = false;

    setPreviews([]);
    setEventStates({});
    setPreviewLoading(true);
    setPreviewError(null);

    const loadPreview = async () => {
      try {
        const translation = await getNewsletterTranslation(newsletterId);
        if (cancelled) return;

        const candidates = translation.dateCandidates ?? [];
        const title = newsletterTitleRef.current || translation.originalText.slice(0, 20);
        const events =
          candidates.length > 0
            ? candidates.map((c) => ({
                title,
                extractedDate: c.normalizedDate,
                checklistIds: null,
              }))
            : [{ title, extractedDate: null, checklistIds: null }];

        await injectCalendarPreviewDummy(newsletterId, events);
        if (cancelled) return;
      } catch {
        // inject 실패해도 preview 조회는 시도
      }

      try {
        const items = await getCalendarPreview(newsletterId);
        if (cancelled) return;
        setPreviews(items);
        const states: Record<string, EventState> = {};
        for (const item of items) {
          if (item.extractedDate) {
            const [y, m, d] = item.extractedDate.split('-');
            states[item.tempEventId] = {
              year: y,
              month: String(Number(m)),
              day: String(Number(d)),
              isEditing: false,
            };
          } else {
            states[item.tempEventId] = { year: '', month: '', day: '', isEditing: false };
          }
        }
        setEventStates(states);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof CalendarApiError && e.code === 'CAL4042') {
          setPreviewError(i18n.t('scan.result.saveBottomSheet.error.expired'));
        } else {
          setPreviewError(i18n.t('scan.result.saveBottomSheet.error.loadFailed'));
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [visible, newsletterId]);

  // 시트 애니메이션
  useEffect(() => {
    if (visible) {
      if (show) return;
      opacity.setValue(0);
      translateY.setValue(SHEET_HEIGHT);
      keyboardOffset.setValue(0);
      setShow(true);
      setStep('confirm');
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, bounciness: 0, speed: 8, useNativeDriver: true }),
      ]).start();
    } else if (show) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, {
          toValue: SHEET_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setShow(false);
      });
    }
  }, [visible, show, opacity, translateY, keyboardOffset]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(keyboardOffset, {
        toValue: -e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? e.duration || 250 : 200,
        useNativeDriver: true,
      }).start();
    });

    const onHide = Keyboard.addListener(hideEvent, (e) => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration || 250 : 200,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [keyboardOffset]);

  const handleDateConfirmFor = useCallback(
    (tempEventId: string) => {
      const es = eventStates[tempEventId];
      if (!formatCorrectedDate(es.year, es.month, es.day)) {
        Alert.alert(
          t('scan.result.saveBottomSheet.error.errorTitle'),
          t('scan.result.saveBottomSheet.error.invalidDate')
        );
        return;
      }
      updateEventState(tempEventId, { isEditing: false });
    },
    [eventStates, t, updateEventState]
  );

  const canRegister = !!newsletterId && previews.length > 0 && !previewLoading && !previewError;

  const handleRegisterConfirm = useCallback(async () => {
    if (!canRegister) {
      Alert.alert(
        t('scan.result.saveBottomSheet.error.registerFailed'),
        t('scan.result.saveBottomSheet.error.noPreviewMsg')
      );
      return;
    }

    const hasInvalidDate = previews.some((p) => {
      const es = eventStates[p.tempEventId];
      return !formatCorrectedDate(es?.year ?? '', es?.month ?? '', es?.day ?? '');
    });
    if (hasInvalidDate) {
      Alert.alert(
        t('scan.result.saveBottomSheet.error.errorTitle'),
        t('scan.result.saveBottomSheet.error.invalidDate')
      );
      return;
    }

    setRegistering(true);
    try {
      const postEvents = previews.map((p) => {
        const es = eventStates[p.tempEventId];
        return {
          tempEventId: p.tempEventId,
          title: p.title,
          startAt: formatCorrectedDate(es.year, es.month, es.day) as string,
          endAt: null,
        };
      });
      await postCalendarEvents(newsletterId!, postEvents);
      setStep('success');
    } catch (e) {
      Alert.alert(t('scan.result.saveBottomSheet.error.registerFailed'), mapRegisterError(e));
    } finally {
      setRegistering(false);
    }
  }, [canRegister, t, previews, eventStates, newsletterId]);

  return (
    <Modal visible={show} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('scan.result.saveBottomSheet.accessibilityClose')}
        />
      </Animated.View>

      <View style={styles.sheetWrap}>
        <Animated.View style={animatedTransformStyle}>
          <View style={sheetStyle} onStartShouldSetResponder={returnTrue}>
            <View style={styles.handle} />

            <View style={styles.iconWrap}>
              <Ionicons name="calendar-outline" size={28} color={colors.primary[400]} />
            </View>

            {step === 'success' ? (
              <>
                <View style={styles.textBlock}>
                  <Text style={styles.title}>
                    {t('scan.result.saveBottomSheet.successTitle')}
                  </Text>
                  <Text style={styles.subtitle}>
                    {t('scan.result.saveBottomSheet.successSubtitle')}
                  </Text>
                </View>
                <ScrollView
                  style={localStyles.scrollArea}
                  contentContainerStyle={localStyles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {previews.map((p) => {
                    const es = eventStates[p.tempEventId];
                    return (
                      <View key={p.tempEventId} style={styles.eventCard}>
                        <View style={styles.eventHeader}>
                          <View style={styles.eventDot} />
                          <View style={styles.successEventInfo}>
                            <Text style={styles.eventTitle}>{p.title} · {childName}</Text>
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
            ) : (
              <>
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
                    <Text style={styles.warningText}>
                      {t('scan.result.saveBottomSheet.dateNotFound')}
                    </Text>
                  </View>
                )}

                <ScrollView
                  style={localStyles.scrollArea}
                  contentContainerStyle={localStyles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {previewLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.primary[400]}
                      style={localStyles.loadingIndicator}
                    />
                  ) : previewError ? (
                    <Text style={localStyles.errorText}>{previewError}</Text>
                  ) : (
                    previews.map((p) => {
                      const es = eventStates[p.tempEventId];
                      if (!es) return null;
                      return (
                        <EventCard
                          key={p.tempEventId}
                          item={p}
                          es={es}
                          childName={childName}
                          onUpdate={updateEventState}
                          onDateConfirm={handleDateConfirmFor}
                          getDisplayDate={getDisplayDate}
                        />
                      );
                    })
                  )}
                </ScrollView>

                <View style={styles.buttons}>
                  <SecondaryButton
                    label={t('scan.result.saveBottomSheet.no')}
                    onPress={onClose}
                    style={STYLE_FLEX_1}
                  />
                  <PrimaryButton
                    label={registering ? '...' : t('scan.result.saveBottomSheet.register')}
                    onPress={handleRegisterConfirm}
                    disabled={registering || !canRegister}
                    style={STYLE_FLEX_2}
                  />
                </View>
              </>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default SaveBottomSheet;
