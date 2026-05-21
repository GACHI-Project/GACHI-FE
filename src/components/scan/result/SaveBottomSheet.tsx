import React, { useEffect, useRef, useState } from 'react';
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
  Platform,
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
  patchCalendarPreviewDates,
  postCalendarEvents,
  CalendarApiError,
} from '../../../api/calendar';
import type { CalendarPreviewItem } from '../../../api/calendar';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDismiss: () => void;
  childName: string;
  newsletterId?: number;
}

const SHEET_HEIGHT = 560;
const returnTrue = () => true;

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

const mapPatchError = (e: unknown): string => {
  if (e instanceof CalendarApiError) {
    if (e.code === 'COMMON4001') return i18n.t('scan.result.saveBottomSheet.error.dateFormat');
    if (e.code === 'NL4041') return i18n.t('scan.result.saveBottomSheet.error.newsletterNotFound');
    if (e.code === 'CAL4042') return i18n.t('scan.result.saveBottomSheet.error.previewExpired');
  }
  return i18n.t('scan.result.saveBottomSheet.error.dateSaveDefault');
};

interface DateInputFieldsProps {
  year: string;
  month: string;
  day: string;
  onYearChange: (v: string) => void;
  onMonthChange: (v: string) => void;
  onDayChange: (v: string) => void;
}

const DateInputFields = ({
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
};

const STYLE_FULL_WIDTH = { width: '100%' } as const;
const STYLE_FLEX_1 = { flex: 1 } as const;
const STYLE_FLEX_2 = { flex: 2 } as const;

const SaveBottomSheet = ({
  visible,
  onClose,
  onConfirm,
  onDismiss,
  childName,
  newsletterId,
}: Props) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<'confirm' | 'success'>('confirm');
  const [isEditing, setIsEditing] = useState(false);
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  const [preview, setPreview] = useState<CalendarPreviewItem | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [datePatching, setDatePatching] = useState(false);
  const [registering, setRegistering] = useState(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const combinedY = useRef(Animated.add(translateY, keyboardOffset)).current;

  const dateFound = preview?.isDateExtracted ?? true;
  const weekdays = t('scan.result.saveBottomSheet.weekdays', { returnObjects: true }) as string[];
  const getDisplayDate = (y: string, m: string, d: string) => {
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    const weekday = Number.isNaN(date.getTime()) ? '' : `${weekdays[date.getDay()]} · `;
    return `${y}${t('scan.result.saveBottomSheet.year')} ${m}${t('scan.result.saveBottomSheet.month')} ${d}${t('scan.result.saveBottomSheet.day')} ${weekday}${t('scan.result.saveBottomSheet.fullDay')}`;
  };
  const displayDate = getDisplayDate(year, month, day);

  // 미리보기 데이터 fetch
  useEffect(() => {
    if (!visible || !newsletterId) return () => {};
    let cancelled = false;

    setPreviewLoading(true);
    setPreviewError(null);

    getCalendarPreview(newsletterId)
      .then((items) => {
        if (cancelled) return;
        const first = items[0] ?? null;
        setPreview(first);
        if (first?.extractedDate) {
          const [y, m, d] = first.extractedDate.split('-');
          setYear(y);
          setMonth(String(Number(m)));
          setDay(String(Number(d)));
        } else {
          setYear('');
          setMonth('');
          setDay('');
        }
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof CalendarApiError && e.code === 'CAL4042') {
          setPreviewError(i18n.t('scan.result.saveBottomSheet.error.expired'));
        } else {
          setPreviewError(i18n.t('scan.result.saveBottomSheet.error.loadFailed'));
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

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
      setIsEditing(false);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, bounciness: 0, speed: 8, useNativeDriver: true }),
      ]).start();
    } else if (show) {
      keyboardOffset.setValue(0);
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

  // 키보드 오프셋
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

  const eventTitle = preview?.title ?? '';

  const renderEventCardContent = () => {
    if (previewLoading) return <ActivityIndicator size="small" color={colors.primary[400]} />;
    if (previewError) return <Text style={localStyles.errorText}>{previewError}</Text>;
    return (
      <>
        <View style={styles.eventHeader}>
          <View style={styles.eventDot} />
          <Text style={styles.eventTitle}>
            {eventTitle} · {childName}
          </Text>
        </View>
        {dateFound ? (
          <View style={styles.eventDateRow}>
            <Text style={styles.eventDate}>{displayDate}</Text>
            <TouchableOpacity
              style={styles.editBadge}
              onPress={() => setIsEditing((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={t('scan.result.saveBottomSheet.accessibilityEdit')}
            >
              <Text style={styles.editBadgeText}>{isEditing ? t('scan.result.saveBottomSheet.isEditing') : t('scan.result.saveBottomSheet.edit')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.divider} />
            <DateInputFields
              year={year}
              month={month}
              day={day}
              onYearChange={setYear}
              onMonthChange={setMonth}
              onDayChange={setDay}
            />
          </>
        )}
      </>
    );
  };

  const handleDateConfirm = async () => {
    const correctedDate = formatCorrectedDate(year, month, day);
    if (!correctedDate) {
      Alert.alert(t('scan.result.saveBottomSheet.error.errorTitle'), t('scan.result.saveBottomSheet.error.invalidDate'));
      return;
    }
    if (newsletterId && preview?.tempEventId) {
      setDatePatching(true);
      try {
        await patchCalendarPreviewDates(newsletterId, [
          { tempEventId: preview.tempEventId, correctedDate },
        ]);
      } catch (e) {
        Alert.alert(t('scan.result.saveBottomSheet.error.dateSaveFailed'), mapPatchError(e));
        setDatePatching(false);
        return;
      }
      setDatePatching(false);
    }
    setIsEditing(false);
  };

  const canRegister = !!newsletterId && !!preview && !previewLoading && !previewError;

  const handleRegisterConfirm = async () => {
    if (!canRegister) {
      Alert.alert(t('scan.result.saveBottomSheet.error.registerFailed'), t('scan.result.saveBottomSheet.error.noPreviewMsg'));
      return;
    }

    const startAt = formatCorrectedDate(year, month, day);
    if (!startAt) {
      Alert.alert(t('scan.result.saveBottomSheet.error.errorTitle'), t('scan.result.saveBottomSheet.error.invalidDate'));
      return;
    }

    if (!dateFound && preview.tempEventId) {
      setDatePatching(true);
      try {
        await patchCalendarPreviewDates(newsletterId, [
          { tempEventId: preview.tempEventId, correctedDate: startAt },
        ]);
      } catch (e) {
        Alert.alert(t('scan.result.saveBottomSheet.error.dateSaveFailed'), mapPatchError(e));
        setDatePatching(false);
        return;
      }
      setDatePatching(false);
    }

    setRegistering(true);
    try {
      await postCalendarEvents(newsletterId, [
        { tempEventId: preview.tempEventId, title: preview.title, startAt, endAt: null },
      ]);
      setStep('success');
    } catch (e) {
      Alert.alert(t('scan.result.saveBottomSheet.error.registerFailed'), mapRegisterError(e));
    }
    setRegistering(false);
  };

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
        <Animated.View style={{ transform: [{ translateY: combinedY }] }}>
          <View
            style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
            onStartShouldSetResponder={returnTrue}
          >
            <View style={styles.handle} />

            <View style={styles.iconWrap}>
              <Ionicons name="calendar-outline" size={28} color={colors.primary[400]} />
            </View>

            {step === 'success' ? (
              <>
                <View style={styles.textBlock}>
                  <Text style={styles.title}>{t('scan.result.saveBottomSheet.successTitle')}</Text>
                  <Text style={styles.subtitle}>{t('scan.result.saveBottomSheet.successSubtitle')}</Text>
                </View>
                <View style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <View style={styles.eventDot} />
                    <View style={styles.successEventInfo}>
                      <Text style={styles.eventTitle}>
                        {eventTitle} · {childName}
                      </Text>
                      <Text style={styles.eventDate}>{displayDate}</Text>
                    </View>
                  </View>
                </View>
                <PrimaryButton
                  label={t('scan.result.saveBottomSheet.viewCalendar')}
                  onPress={onConfirm}
                  style={STYLE_FULL_WIDTH}
                />
                <SecondaryButton label={t('scan.result.saveBottomSheet.close')} onPress={onDismiss} style={STYLE_FULL_WIDTH} />
              </>
            ) : (
              <>
                <View style={styles.textBlock}>
                  <Text style={styles.title}>{t('scan.result.saveBottomSheet.title')}</Text>
                  <Text style={styles.subtitle}>
                    {dateFound
                      ? t('scan.result.saveBottomSheet.subtitleAutoDate')
                      : t('scan.result.saveBottomSheet.subtitleManualDate')}
                  </Text>
                </View>

                {!dateFound && (
                  <View style={styles.warningCard}>
                    <Ionicons name="warning" size={16} color={colors.text.primary} />
                    <Text style={styles.warningText}>{t('scan.result.saveBottomSheet.dateNotFound')}</Text>
                  </View>
                )}

                <View style={styles.eventCard}>{renderEventCardContent()}</View>

                {dateFound && isEditing && (
                  <View style={styles.dateEditorCard}>
                    <Text style={styles.dateEditorLabel}>{t('scan.result.saveBottomSheet.dateEditor')}</Text>
                    <DateInputFields
                      year={year}
                      month={month}
                      day={day}
                      onYearChange={setYear}
                      onMonthChange={setMonth}
                      onDayChange={setDay}
                    />
                    <TouchableOpacity
                      style={styles.dateConfirmBtn}
                      onPress={handleDateConfirm}
                      disabled={datePatching}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('scan.result.saveBottomSheet.accessibilityDateConfirm')}
                    >
                      {datePatching ? (
                        <ActivityIndicator size="small" color={colors.text.white} />
                      ) : (
                        <Text style={styles.dateConfirmBtnText}>{t('scan.result.saveBottomSheet.accessibilityDateConfirm')}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.buttons}>
                  <SecondaryButton label={t('scan.result.saveBottomSheet.no')} onPress={onClose} style={STYLE_FLEX_1} />
                  <PrimaryButton
                    label={datePatching || registering ? '...' : t('scan.result.saveBottomSheet.register')}
                    onPress={handleRegisterConfirm}
                    disabled={datePatching || registering || !canRegister}
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

const localStyles = StyleSheet.create({
  errorText: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
