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

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

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
    if (e.code === 'COMMON4001') return '입력값이 올바르지 않아요.';
    if (e.code === 'NL4041') return '가정통신문을 찾을 수 없어요.';
  }
  return '일정 등록에 실패했어요.';
};

const mapPatchError = (e: unknown): string => {
  if (e instanceof CalendarApiError) {
    if (e.code === 'COMMON4001') return '날짜 형식이 올바르지 않아요.';
    if (e.code === 'NL4041') return '가정통신문을 찾을 수 없어요.';
    if (e.code === 'CAL4042') return '미리보기 데이터가 만료됐어요. 다시 시도해주세요.';
  }
  return '날짜 저장에 실패했어요.';
};

const getDisplayDate = (y: string, m: string, d: string) => {
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const weekday = Number.isNaN(date.getTime()) ? '' : `${WEEKDAYS[date.getDay()]}요일 · `;
  return `${y}년 ${m}월 ${d}일 ${weekday}종일`;
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
}: DateInputFieldsProps) => (
  <View style={styles.dateInputRow}>
    <View style={styles.dateInputWrap}>
      <TextInput
        style={styles.dateInput}
        value={year}
        onChangeText={onYearChange}
        keyboardType="number-pad"
        maxLength={4}
        accessibilityLabel="년도"
      />
      <Text style={styles.dateUnit}>년</Text>
    </View>
    <View style={styles.dateInputWrap}>
      <TextInput
        style={styles.dateInput}
        value={month}
        onChangeText={onMonthChange}
        keyboardType="number-pad"
        maxLength={2}
        accessibilityLabel="월"
      />
      <Text style={styles.dateUnit}>월</Text>
    </View>
    <View style={styles.dateInputWrap}>
      <TextInput
        style={styles.dateInput}
        value={day}
        onChangeText={onDayChange}
        keyboardType="number-pad"
        maxLength={2}
        accessibilityLabel="일"
      />
      <Text style={styles.dateUnit}>일</Text>
    </View>
  </View>
);

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
          setPreviewError('AI 분석 중이거나 미리보기 데이터가 만료됐어요.');
        } else {
          setPreviewError('일정 정보를 불러오는 데 실패했어요.');
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
              accessibilityLabel="일정 수정"
            >
              <Text style={styles.editBadgeText}>{isEditing ? '✏️ 수정 중' : '✏️ 수정'}</Text>
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
      Alert.alert('오류', '올바른 날짜를 입력해주세요.');
      return;
    }
    if (newsletterId && preview?.tempEventId) {
      setDatePatching(true);
      try {
        await patchCalendarPreviewDates(newsletterId, [
          { tempEventId: preview.tempEventId, correctedDate },
        ]);
      } catch (e) {
        Alert.alert('날짜 저장 실패', mapPatchError(e));
        setDatePatching(false);
        return;
      }
      setDatePatching(false);
    }
    setIsEditing(false);
  };

  const handleRegisterConfirm = async () => {
    const startAt = formatCorrectedDate(year, month, day);
    if (!startAt) {
      Alert.alert('오류', '올바른 날짜를 입력해주세요.');
      return;
    }

    if (!dateFound && newsletterId && preview?.tempEventId) {
      setDatePatching(true);
      try {
        await patchCalendarPreviewDates(newsletterId, [
          { tempEventId: preview.tempEventId, correctedDate: startAt },
        ]);
      } catch (e) {
        Alert.alert('날짜 저장 실패', mapPatchError(e));
        setDatePatching(false);
        return;
      }
      setDatePatching(false);
    }

    if (newsletterId && preview) {
      setRegistering(true);
      try {
        await postCalendarEvents(newsletterId, [
          { tempEventId: preview.tempEventId, title: preview.title, startAt, endAt: null },
        ]);
      } catch (e) {
        Alert.alert('등록 실패', mapRegisterError(e));
        setRegistering(false);
        return;
      }
      setRegistering(false);
    }

    setStep('success');
  };

  return (
    <Modal visible={show} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="모달 닫기"
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
                  <Text style={styles.title}>캘린더에 등록됐어요!</Text>
                  <Text style={styles.subtitle}>마감일이 다가오면 알려드릴게요.</Text>
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
                  label="캘린더에서 보기"
                  onPress={onConfirm}
                  style={STYLE_FULL_WIDTH}
                />
                <SecondaryButton label="닫기" onPress={onDismiss} style={STYLE_FULL_WIDTH} />
              </>
            ) : (
              <>
                <View style={styles.textBlock}>
                  <Text style={styles.title}>캘린더에 일정을 등록하시겠습니까?</Text>
                  <Text style={styles.subtitle}>
                    {dateFound
                      ? '추출된 날짜 정보를 바탕으로\n자동으로 일정이 생성돼요.'
                      : '날짜를 직접 입력해주세요.'}
                  </Text>
                </View>

                {!dateFound && (
                  <View style={styles.warningCard}>
                    <Ionicons name="warning" size={16} color={colors.text.primary} />
                    <Text style={styles.warningText}>
                      {'문서에서 날짜를 찾지 못했어요.\n날짜를 직접 입력하면 등록할 수 있어요.'}
                    </Text>
                  </View>
                )}

                <View style={styles.eventCard}>{renderEventCardContent()}</View>

                {dateFound && isEditing && (
                  <View style={styles.dateEditorCard}>
                    <Text style={styles.dateEditorLabel}>날짜 변경</Text>
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
                      accessibilityLabel="날짜 확인"
                    >
                      {datePatching ? (
                        <ActivityIndicator size="small" color={colors.text.white} />
                      ) : (
                        <Text style={styles.dateConfirmBtnText}>확인</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.buttons}>
                  <SecondaryButton label="아니요" onPress={onClose} style={STYLE_FLEX_1} />
                  <PrimaryButton
                    label={datePatching || registering ? '저장 중...' : '✓ 네, 등록할게요'}
                    onPress={handleRegisterConfirm}
                    disabled={datePatching || registering}
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
