import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Animated,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  CalendarDatePatchEvent,
  CalendarPostEvent,
  CalendarPreviewItem,
} from '../../../api/calendar';
import { CalendarApiError, getCalendarPreview } from '../../../api/calendar';
import i18n from '../../../i18n';
import { registerNewsletterCalendar } from '../../../query/calendar';
import { useApiMutation, useServerQuery } from '../../../query/hooks';
import { isTransientQueryError } from '../../../query/state';
import { getCalendarDday } from '../../../utils/calendarDday';
import { formatEventTime } from '../../../utils/calendarEventTime';
import {
  createCalendarPreviewDraft,
  getCalendarPreviewSchedule,
} from '../../../utils/calendarPreview';
import { getKstDate } from '../../../utils/calendarWeek';
import ConfirmStep from './ConfirmStep';
import type { EventState } from './EventPreviewCard';
import styles from './styles';
import SuccessStep from './SuccessStep';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date?: string) => void;
  onDismiss: () => void;
  childName: string;
  newsletterId?: number;
}

interface PreviewDraft {
  newsletterId: number;
  previews: CalendarPreviewItem[];
  eventStates: Record<string, EventState>;
  // 일정 기간 계산용 originalStartAt과 별도로 마지막 PATCH 성공 날짜를 보존한다.
  confirmedDates: Record<string, string | undefined>;
  invalid: boolean;
}

const getClosestEventDate = (
  previews: CalendarPreviewItem[],
  eventStates: Record<string, EventState>
): string | undefined => {
  const today = getKstDate();
  let closest: string | undefined;
  let minDiff = Infinity;

  previews.forEach((p) => {
    const es = eventStates[p.tempEventId];
    const schedule = es && getCalendarPreviewSchedule(es);
    if (!schedule) return;
    const diff = getCalendarDday(schedule.startAt, today);
    if (diff === null) return;
    const absDiff = Math.abs(diff);
    if (absDiff < minDiff) {
      minDiff = absDiff;
      closest = schedule.startAt.slice(0, 10);
    }
  });

  return closest;
};

const SHEET_HEIGHT = 560;

const mapRegisterError = (e: unknown): string => {
  if (e instanceof CalendarApiError) {
    if (e.code === 'COMMON4001') return i18n.t('scan.result.saveBottomSheet.error.invalidInput');
    if (e.code === 'NL4041') return i18n.t('scan.result.saveBottomSheet.error.newsletterNotFound');
    if (e.status === 404 || e.code === 'CAL4042')
      return i18n.t('scan.result.saveBottomSheet.error.expired');
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
}: Props) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [show, setShow] = useState(false);
  const [step, setStep] = useState<'confirm' | 'success'>('confirm');
  const previewQuery = useServerQuery(
    'preview',
    [newsletterId],
    (signal) => getCalendarPreview(newsletterId!, signal),
    { enabled: visible && !!newsletterId, staleTime: 0 }
  );
  const { data: previewData, error: previewQueryError } = previewQuery;
  const [draft, setDraft] = useState<PreviewDraft | null>(null);
  const registerCalendar = useApiMutation(
    (id: number, events: CalendarPostEvent[], corrections: CalendarDatePatchEvent[]) =>
      registerNewsletterCalendar(id, events, corrections, (confirmed) => {
        setDraft((current) => {
          if (current?.newsletterId !== id) return current;
          const confirmedDates = { ...current.confirmedDates };
          confirmed.forEach(({ tempEventId, correctedDate }) => {
            confirmedDates[tempEventId] = correctedDate;
          });
          return { ...current, confirmedDates };
        });
      })
  );
  const currentDraft = draft?.newsletterId === newsletterId ? draft : null;
  const previews = useMemo(
    () => currentDraft?.previews ?? previewData ?? [],
    [currentDraft, previewData]
  );
  const eventStates = useMemo(() => currentDraft?.eventStates ?? {}, [currentDraft]);
  let previewError: string | null = null;
  if (!newsletterId) previewError = t('scan.result.saveBottomSheet.error.noPreviewMsg');
  else if (
    previewQueryError &&
    !(currentDraft && !currentDraft.invalid && isTransientQueryError(previewQueryError))
  )
    previewError = t(
      previewQueryError instanceof CalendarApiError &&
        (previewQueryError.status === 404 || previewQueryError.code === 'CAL4042')
        ? 'scan.result.saveBottomSheet.error.expired'
        : 'scan.result.saveBottomSheet.error.loadFailed'
    );
  else if (currentDraft?.invalid) previewError = t('scan.result.saveBottomSheet.error.loadFailed');
  const previewRefreshError = previewQueryError && !previewError ? t('common.refreshFailed') : null;
  const previewLoading =
    visible && !!newsletterId && !previewError && (previewQuery.isLoading || !currentDraft);
  const [registering, setRegistering] = useState(false);

  const updateEventState = useCallback(
    (id: string, patch: Partial<EventState>) =>
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              eventStates: {
                ...prev.eventStates,
                [id]: { ...prev.eventStates[id], ...patch },
              },
            }
          : prev
      ),
    []
  );

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

  const hasAnyMissingDate = previews.some((p) => !eventStates[p.tempEventId]?.originalStartAt);

  const getDisplayDate = useCallback(
    (event: EventState) => {
      const schedule = getCalendarPreviewSchedule(event);
      if (!schedule) return '';
      const date = new Date(Number(event.year), Number(event.month) - 1, Number(event.day));
      const dateStr = new Intl.DateTimeFormat(i18n.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }).format(date);
      const time = formatEventTime(schedule.startAt, schedule.endAt, {
        allDay: event.allDay,
        endAllDay: event.allDay === true ? true : undefined,
        allDayLabel: t('scan.result.saveBottomSheet.fullDay'),
      });
      return time ? `${dateStr} · ${time}` : dateStr;
    },
    [t]
  );

  // 시트를 연 시점의 데이터로 편집 초안을 만든다. 백그라운드 조회로 입력을 덮어쓰지 않는다.
  useEffect(() => {
    if (!visible) {
      setDraft(null);
      return;
    }
    if (
      !newsletterId ||
      !previewData ||
      previewQuery.isFetching ||
      (currentDraft && (!currentDraft.invalid || currentDraft.previews === previewData))
    )
      return;
    try {
      const states = previewData.reduce<Record<string, EventState>>((result, item) => {
        const eventDraft = createCalendarPreviewDraft(item);
        if (!eventDraft) throw new Error('Invalid calendar preview date');
        return { ...result, [item.tempEventId]: { ...eventDraft, isEditing: false } };
      }, {});
      const confirmedDates = Object.fromEntries(
        Object.entries(states).map(([key, state]) => [key, state.originalStartAt?.slice(0, 10)])
      );
      setDraft({
        newsletterId,
        previews: previewData,
        eventStates: states,
        confirmedDates,
        invalid: false,
      });
    } catch {
      setDraft({
        newsletterId,
        previews: previewData,
        eventStates: {},
        confirmedDates: {},
        invalid: true,
      });
    }
  }, [visible, newsletterId, previewData, currentDraft, previewQuery.isFetching]);

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
      if (!es || !getCalendarPreviewSchedule(es)) {
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
    if (!canRegister || !currentDraft) {
      Alert.alert(
        t('scan.result.saveBottomSheet.error.registerFailed'),
        t('scan.result.saveBottomSheet.error.noPreviewMsg')
      );
      return;
    }

    const hasInvalidDate = previews.some((p) => {
      const es = eventStates[p.tempEventId];
      return !es || !getCalendarPreviewSchedule(es);
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
          ...getCalendarPreviewSchedule(es)!,
        };
      });
      // 날짜가 바뀐 일정은 등록 전에 서버에 알려야 연결된 체크리스트 날짜도 함께 반영된다.
      const dateCorrections = postEvents
        .map((e) => ({
          tempEventId: e.tempEventId,
          correctedDate: e.startAt.slice(0, 10),
          originalDate: currentDraft.confirmedDates[e.tempEventId],
        }))
        .filter((e) => e.correctedDate !== e.originalDate)
        .map(({ tempEventId, correctedDate }) => ({ tempEventId, correctedDate }));
      await registerCalendar(newsletterId!, postEvents, dateCorrections);
      setStep('success');
    } catch (e) {
      Alert.alert(t('scan.result.saveBottomSheet.error.registerFailed'), mapRegisterError(e));
    } finally {
      setRegistering(false);
    }
  }, [canRegister, currentDraft, t, previews, eventStates, newsletterId, registerCalendar]);

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
                  onConfirm={() => onConfirm(getClosestEventDate(previews, eventStates))}
                  onDismiss={onDismiss}
                />
              ) : (
                <ConfirmStep
                  hasAnyMissingDate={hasAnyMissingDate}
                  previewLoading={previewLoading}
                  previewError={previewError}
                  previewRefreshError={previewRefreshError}
                  onRetryPreview={() => {
                    void previewQuery.refetch();
                  }}
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
