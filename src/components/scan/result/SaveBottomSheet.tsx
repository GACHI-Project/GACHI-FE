import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Modal,
  Pressable,
  Animated,
  StyleSheet,
  Keyboard,
  Platform,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';
import styles from './styles';
import {
  getCalendarPreview,
  postCalendarEvents,
  injectCalendarPreviewDummy,
  CalendarApiError,
} from '../../../api/calendar';
import type { CalendarPreviewItem } from '../../../api/calendar';
import { getNewsletterTranslation } from '../../../api/newsletter';
import type { EventState } from './EventPreviewCard';
import ConfirmStep from './ConfirmStep';
import SuccessStep from './SuccessStep';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDismiss: () => void;
  childName: string;
  newsletterId?: number;
  newsletterTitle?: string;
}

const SHEET_HEIGHT = 560;

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

const SaveBottomSheet = ({
  visible,
  onClose,
  onConfirm,
  onDismiss,
  childName,
  newsletterId,
  newsletterTitle,
}: Props) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
  useEffect(() => {
    newsletterTitleRef.current = newsletterTitle;
  }, [newsletterTitle]);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const sheetWrapBottom = useRef(new Animated.Value(0)).current;

  const animatedTransformStyle = useRef({ transform: [{ translateY }] }).current;

  const sheetStyle = useMemo(
    () => [
      styles.sheet,
      { paddingBottom: insets.bottom + 20, height: windowHeight * 0.85 - keyboardHeight },
    ],
    [insets.bottom, windowHeight, keyboardHeight]
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
    [t]
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
        const states = items.reduce<Record<string, EventState>>((acc, item) => {
          if (item.extractedDate) {
            const [y, m, d] = item.extractedDate.split('-');
            acc[item.tempEventId] = {
              year: y,
              month: String(Number(m)),
              day: String(Number(d)),
              isEditing: false,
            };
          } else {
            acc[item.tempEventId] = { year: '', month: '', day: '', isEditing: false };
          }
          return acc;
        }, {});
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
      sheetWrapBottom.setValue(0);
      setKeyboardHeight(0);
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
  }, [visible, show, opacity, translateY, sheetWrapBottom]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (e) => {
      const kbH = e.endCoordinates.height;
      setKeyboardHeight(kbH);
      Animated.timing(sheetWrapBottom, {
        toValue: kbH,
        duration: Platform.OS === 'ios' ? e.duration || 250 : 200,
        useNativeDriver: false,
      }).start();
    });

    const onHide = Keyboard.addListener(hideEvent, (e) => {
      setKeyboardHeight(0);
      Animated.timing(sheetWrapBottom, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration || 250 : 200,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [sheetWrapBottom]);

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
      <View style={styles.modalRoot}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, { opacity }]}
          pointerEvents="none"
        />

        <Pressable
          style={styles.backdropTap}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('scan.result.saveBottomSheet.accessibilityClose')}
        />

        <Animated.View style={[styles.sheetWrap, { bottom: sheetWrapBottom }]}>
          <Animated.View style={animatedTransformStyle}>
            <View style={sheetStyle}>
              <View style={styles.handle} />

              {step === 'success' ? (
                <SuccessStep
                  previews={previews}
                  eventStates={eventStates}
                  childName={childName}
                  getDisplayDate={getDisplayDate}
                  onConfirm={onConfirm}
                  onDismiss={onDismiss}
                />
              ) : (
                <ConfirmStep
                  hasAnyMissingDate={hasAnyMissingDate}
                  previewLoading={previewLoading}
                  previewError={previewError}
                  previews={previews}
                  eventStates={eventStates}
                  childName={childName}
                  registering={registering}
                  canRegister={canRegister}
                  onUpdate={updateEventState}
                  onDateConfirm={handleDateConfirmFor}
                  getDisplayDate={getDisplayDate}
                  onClose={onClose}
                  onRegister={handleRegisterConfirm}
                />
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default SaveBottomSheet;
