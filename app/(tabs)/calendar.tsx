import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import colors from '../../src/constants/colors';
import styles from '../../src/components/calendar/styles';
import Header from '../../src/components/common/Header';
import ChildFilterBar from '../../src/components/common/ChildFilterBar';
import ConfirmModal from '../../src/components/common/ConfirmModal';
import WeekViewContent from '../../src/components/calendar/WeekViewContent';
import MonthViewContent from '../../src/components/calendar/MonthViewContent';
import {
  fetchSchoolSchedules,
  CalendarApiError,
  type HolidayItem,
  type SchoolGroup,
} from '../../src/api/calendar';
import { fetchChildren as fetchChildrenApi } from '../../src/api/child';
import { useChildrenStore } from '../../src/store/childrenStore';
import useCalendarMarkers from '../../src/hooks/calendar/useCalendarMarkers';
import useCalendarEvents from '../../src/hooks/calendar/useCalendarEvents';
import { getKstDate } from '../../src/utils/calendarWeek';

const CalendarScreen = () => {
  const today = getKstDate();
  const todayDate = new Date(`${today}T12:00:00`);
  const { t } = useTranslation();
  const { children, setChildren: setStoreChildren } = useChildrenStore();
  const [selectedChildName, setSelectedChildName] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isWeekMode, setIsWeekMode] = useState<boolean>(true);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [calendarMonth, setCalendarMonth] = useState({
    year: todayDate.getFullYear(),
    month: todayDate.getMonth(),
  });
  const [schoolGroups, setSchoolGroups] = useState<SchoolGroup[]>([]);
  const [commonHolidays, setCommonHolidays] = useState<HolidayItem[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();

  useEffect(() => {
    if (!dateParam) return;
    setSelectedDate(dateParam);
    setIsWeekMode(false);
    const [y, m] = dateParam.split('-').map(Number);
    setCalendarMonth({ year: y, month: m - 1 });
  }, [dateParam]);

  const [focusKey, setFocusKey] = useState(0);
  const hasFocusedOnceRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnceRef.current) {
        hasFocusedOnceRef.current = true;
        fetchChildrenApi()
          .then(setStoreChildren)
          .catch(() => {});
        return;
      }
      fetchChildrenApi()
        .then(setStoreChildren)
        .catch(() => {});
      setFocusKey((k) => k + 1);
    }, [setStoreChildren])
  );

  const selectedChildId = useMemo(
    () => children.find((c) => c.name === selectedChildName)?.id,
    [children, selectedChildName]
  );

  const scrollRef = useRef<import('react-native').ScrollView>(null);
  const weekOffsetRef = useRef(weekOffset);
  const shouldAutoScrollRef = useRef(weekOffset === 0);
  weekOffsetRef.current = weekOffset;
  const todayGroupY = useRef<number | undefined>(undefined);
  const isFirstChildRenderRef = useRef(true);
  const schoolReqIdRef = useRef(0);

  useEffect(() => {
    shouldAutoScrollRef.current = weekOffset === 0;
  }, [weekOffset]);

  useEffect(() => {
    if (isFirstChildRenderRef.current) {
      isFirstChildRenderRef.current = false;
      return;
    }
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    setShowScrollTop(false);
  }, [selectedChildName]);

  const weekDates = useMemo(() => {
    const d = new Date(`${today}T12:00:00`);
    const dayOfWeek = d.getDay();
    d.setDate(d.getDate() - dayOfWeek + weekOffset * 7);
    d.setHours(0, 0, 0, 0);
    const sunDate = d.getDate();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(d);
      date.setDate(sunDate + i);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
  }, [weekOffset, today]);

  const schoolFromDate = useMemo(() => {
    if (isWeekMode) return weekDates[0];
    return `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-01`;
  }, [isWeekMode, weekDates, calendarMonth.year, calendarMonth.month]);

  const schoolToDate = useMemo(() => {
    if (isWeekMode) return weekDates[6];
    const lastDay = new Date(calendarMonth.year, calendarMonth.month + 1, 0).getDate();
    return `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  }, [isWeekMode, weekDates, calendarMonth.year, calendarMonth.month]);

  useEffect(() => {
    schoolReqIdRef.current += 1;
    const reqId = schoolReqIdRef.current;
    fetchSchoolSchedules(schoolFromDate, schoolToDate)
      .then((data) => {
        if (reqId !== schoolReqIdRef.current) return;
        setCommonHolidays(data.commonHolidays);
        setSchoolGroups(data.schoolSchedules);
      })
      .catch((e) => {
        if (reqId !== schoolReqIdRef.current) return;
        // eslint-disable-next-line no-console
        console.error('fetchSchoolSchedules failed:', e);
      });
  }, [schoolFromDate, schoolToDate, focusKey]);

  const { markedDatesMap, markersLoading } = useCalendarMarkers({
    isWeekMode,
    calendarMonth,
    selectedChildName,
    focusKey,
    commonHolidays,
    schoolGroups,
    refreshKey,
  });

  const {
    weekDisplayGroups,
    weekMarkedDates,
    dayEvents,
    daySchoolSchedules,
    weekEventsLoading,
    dailyEventsLoading,
    dailyEventsError,
    toggleCheck,
    deleteEvent,
  } = useCalendarEvents({
    isWeekMode,
    weekDates,
    selectedDate,
    selectedChildName,
    selectedChildId,
    focusKey,
    commonHolidays,
    schoolGroups,
  });

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleMode = () => {
    setIsWeekMode((prev) => !prev);
    setExpandedIds(new Set());
    setShowScrollTop(false);
  };

  const handleScroll = ({ nativeEvent }: { nativeEvent: { contentOffset: { y: number } } }) => {
    const { height: windowHeight } = require('react-native').Dimensions.get('window');
    setShowScrollTop(nativeEvent.contentOffset.y > windowHeight * 1.0);
  };

  const syncSelectedDateToMonth = (year: number, month: number) => {
    setSelectedDate((prev) => {
      const day = Number(prev.split('-')[2]);
      const lastDay = new Date(year, month + 1, 0).getDate();
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
    });
  };

  const handlePrevMonth = () => {
    setCalendarMonth(({ year, month }) => {
      const next = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
      syncSelectedDateToMonth(next.year, next.month);
      return next;
    });
  };

  const handleNextMonth = () => {
    setCalendarMonth(({ year, month }) => {
      const next = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
      syncSelectedDateToMonth(next.year, next.month);
      return next;
    });
  };

  const mapDeleteError = (error: unknown): string => {
    if (
      error instanceof CalendarApiError &&
      (error.code === 'UNAUTHORIZED' || error.status === 401)
    ) {
      return t('calendar.delete.error.unauthorized');
    }
    return t('calendar.delete.error.default');
  };

  const handleRequestDelete = (eventId: number) => {
    setDeleteTargetId(eventId);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setDeleteTargetId(null);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId === null || isDeleting) return;
    const eventId = deleteTargetId;
    setIsDeleting(true);
    try {
      await deleteEvent(eventId);
      setExpandedIds((prev) => {
        if (!prev.has(eventId)) return prev;
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
      setRefreshKey((k) => k + 1);
      setDeleteTargetId(null);
    } catch (error) {
      Alert.alert(t('common.error'), mapDeleteError(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <Header
          title={t('calendar.title')}
          rightComponent={
            <TouchableOpacity
              style={[styles.iconButton, styles.calendarIconButton]}
              onPress={handleToggleMode}
              accessibilityRole="button"
              accessibilityLabel={
                isWeekMode
                  ? t('calendar.weekViewAccessibility')
                  : t('calendar.monthViewAccessibility')
              }
            >
              <FontAwesome5
                name={isWeekMode ? 'calendar-alt' : 'calendar-week'}
                size={14}
                color={colors.primary[400]}
                solid
              />
            </TouchableOpacity>
          }
        />
      </View>

      <ChildFilterBar
        items={children}
        selectedChildName={selectedChildName}
        onSelect={setSelectedChildName}
      />

      {isWeekMode ? (
        <WeekViewContent
          scrollRef={scrollRef}
          weekDates={weekDates}
          today={today}
          weekMarkedDates={weekMarkedDates}
          isLoading={weekEventsLoading}
          weekDisplayGroups={weekDisplayGroups}
          expandedIds={expandedIds}
          weekOffsetRef={weekOffsetRef}
          shouldAutoScrollRef={shouldAutoScrollRef}
          todayGroupY={todayGroupY}
          onWeekPrev={() => setWeekOffset((o) => o - 1)}
          onWeekNext={() => setWeekOffset((o) => o + 1)}
          onScroll={handleScroll}
          onToggleExpand={toggleExpand}
          onToggleCheck={toggleCheck}
          onDeleteRequest={handleRequestDelete}
        />
      ) : (
        <MonthViewContent
          scrollRef={scrollRef}
          calendarMonth={calendarMonth}
          today={today}
          selectedDate={selectedDate}
          markedDatesMap={markedDatesMap}
          isLoading={markersLoading}
          isDailyLoading={dailyEventsLoading}
          dailyEventsError={dailyEventsError}
          dayEvents={dayEvents}
          daySchoolSchedules={daySchoolSchedules}
          expandedIds={expandedIds}
          onDayPress={(date) => {
            setSelectedDate(date);
            const [year, month] = date.split('-').map(Number);
            setCalendarMonth({ year, month: month - 1 });
          }}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onScroll={handleScroll}
          onToggleExpand={toggleExpand}
          onToggleCheck={toggleCheck}
          onDeleteRequest={handleRequestDelete}
        />
      )}

      {showScrollTop && (
        <TouchableOpacity
          style={styles.scrollTopButton}
          onPress={() => {
            scrollRef.current?.scrollTo({ y: 0, animated: true });
            setShowScrollTop(false);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('calendar.scrollToTop')}
        >
          <Ionicons name="arrow-up" size={20} color={colors.text.white} />
        </TouchableOpacity>
      )}

      <ConfirmModal
        visible={deleteTargetId !== null}
        onClose={handleCancelDelete}
        icon={<Ionicons name="trash-outline" size={28} color={colors.primary[400]} />}
        title={t('calendar.delete.confirmTitle')}
        description={t('calendar.delete.confirmDesc')}
        cancelText={t('common.close')}
        onCancel={handleCancelDelete}
        confirmText={t('calendar.delete.confirm')}
        onConfirm={handleConfirmDelete}
        confirmDisabled={isDeleting}
      />
    </View>
  );
};

export default CalendarScreen;
