import { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton, SecondaryButton } from '../../common/Button';
import styles from '../../../styles/scan/saveBottomSheet';
import colors from '../../../constants/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDismiss: () => void;
  childName: string;
  dateFound?: boolean;
}

const SHEET_HEIGHT = 560;
const returnTrue = () => true;

interface DateInputFieldsProps {
  year: string;
  month: string;
  day: string;
  onYearChange: (v: string) => void;
  onMonthChange: (v: string) => void;
  onDayChange: (v: string) => void;
}

function DateInputFields({ year, month, day, onYearChange, onMonthChange, onDayChange }: DateInputFieldsProps) {
  return (
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
}

// TODO: 실제 문서에서 추출한 일정 데이터로 교체
const MOCK_EVENT = {
  title: '봄 현장학습',
  reminders: ['동의서 마감 알림 - 3월 22일', '당일 준비 알림 - 3월 26일'],
};

const STYLE_FULL_WIDTH = { width: '100%' } as const;
const STYLE_FLEX_1 = { flex: 1 } as const;
const STYLE_FLEX_2 = { flex: 2 } as const;

export default function SaveBottomSheet({
  visible,
  onClose,
  onConfirm,
  onDismiss,
  childName,
  dateFound = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<'confirm' | 'success'>('confirm');
  const [isEditing, setIsEditing] = useState(false);
  // TODO: 추출된 날짜로 초기값 설정
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('3');
  const [day, setDay] = useState('26');

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const combinedY = useRef(Animated.add(translateY, keyboardOffset)).current;

  const displayDate = `${year}년 ${month}월 ${day}일 목요일 · 종일`; // TODO: 추출된 날짜 및 실제 요일 계산으로 교체

  useEffect(() => {
    if (visible) {
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
                      <Text style={styles.eventTitle}>{MOCK_EVENT.title} · {childName}</Text>
                      <Text style={styles.eventDate}>{displayDate}</Text>
                    </View>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.reminderList}>
                    {MOCK_EVENT.reminders.map((r) => (
                      <View key={r} style={styles.reminderRow}>
                        <Text style={styles.reminderBullet}>•</Text>
                        <Text style={styles.reminderText}>{r}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <PrimaryButton label="캘린더에서 보기" onPress={onConfirm} style={STYLE_FULL_WIDTH} />
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
                <View style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <View style={styles.eventDot} />
                    <Text style={styles.eventTitle}>{MOCK_EVENT.title} · {childName}</Text>
                  </View>
                  {dateFound ? (
                    <>
                      <View style={styles.eventDateRow}>
                        <Text style={styles.eventDate}>{displayDate}</Text>
                        <TouchableOpacity
                          style={styles.editBadge}
                          onPress={() => setIsEditing((v) => !v)}
                          accessibilityRole="button"
                          accessibilityLabel="일정 수정"
                        >
                          <Text style={styles.editBadgeText}>
                            {isEditing ? '✏️ 수정 중' : '✏️ 수정'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.reminderList}>
                        {MOCK_EVENT.reminders.map((r) => (
                          <View key={r} style={styles.reminderRow}>
                            <Text style={styles.reminderBullet}>•</Text>
                            <Text style={styles.reminderText}>{r}</Text>
                          </View>
                        ))}
                      </View>
                    </>
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
                </View>
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
                      onPress={() => setIsEditing(false)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="날짜 확인"
                    >
                      <Text style={styles.dateConfirmBtnText}>확인</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <View style={styles.buttons}>
                  <SecondaryButton label="아니요" onPress={onClose} style={STYLE_FLEX_1} />
                  <PrimaryButton
                    label="✓ 네, 등록할게요"
                    onPress={() => setStep('success')}
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
}
