import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/calendar/calendar';
import Header from '../../src/components/common/Header';
import EventCard from '../../src/components/calendar/EventCard';
import WeekCalendar from '../../src/components/calendar/WeekCalendar';
import MonthCalendar from '../../src/components/calendar/MonthCalendar';
import ChildFilterBar from '../../src/components/common/ChildFilterBar';
import {
  fetchMonthlyMarkers,
  fetchDailyEvents,
  fetchWeeklyEvents,
  fetchSchoolSchedules,
  completeChecklist,
  type CalendarEvent,
  type WeeklyResult,
  type MonthlyMarker,
  type HolidayItem,
  type SchoolGroup,
} from '../../src/api/calendar';
import {
  getHolidaysForDate,
  getAcademicSchedulesForDate,
  getSchoolDotsForDate,
} from '../../src/utils/schoolSchedule';
import SchoolScheduleRow from '../../src/components/calendar/SchoolScheduleRow';
import { useChildrenStore } from '../../src/store/childrenStore';

const todayDate = new Date();
const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

const formatDayLabel = (dateStr: string, locale: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(
    new Date(year, month - 1, day)
  );
};

const formatWeekDateHeader = (dateStr: string, locale: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(year, month - 1, day));
};

const CalendarScreen = () => {
  const { t, i18n } = useTranslation();
  const { children } = useChildrenStore();
  const [selectedChildName, setSelectedChildName] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [monthlyMarkers, setMonthlyMarkers] = useState<MonthlyMarker[]>([]);
  const [dayEvents, setDayEvents] = useState<CalendarEvent[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDailyLoading, setIsDailyLoading] = useState(false);
  const [isWeekMode, setIsWeekMode] = useState<boolean>(true);
  const [schoolGroups, setSchoolGroups] = useState<SchoolGroup[]>([]);
  const [commonHolidays, setCommonHolidays] = useState<HolidayItem[]>([]);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [calendarMonth, setCalendarMonth] = useState({
    year: todayDate.getFullYear(),
    month: todayDate.getMonth(),
  });

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
        return;
      }
      setFocusKey((k) => k + 1);
    }, [])
  );

  const selectedChildId = useMemo(
    () => children.find((c) => c.name === selectedChildName)?.id,
    [children, selectedChildName]
  );

  const weekScrollRef = useRef<ScrollView>(null);
  const weekOffsetRef = useRef(weekOffset);
  const shouldAutoScrollRef = useRef(weekOffset === 0);
  weekOffsetRef.current = weekOffset;
  const todayGroupY = useRef<number | undefined>(undefined);
  const weeklyReqIdRef = useRef(0);
  const monthlyReqIdRef = useRef(0);
  const dailyReqIdRef = useRef(0);
  const schoolReqIdRef = useRef(0);

  useEffect(() => {
    shouldAutoScrollRef.current = weekOffset === 0;
  }, [weekOffset]);

  const weekDates = useMemo(() => {
    const d = new Date();
    const dayOfWeek = d.getDay();
    d.setDate(d.getDate() - dayOfWeek + weekOffset * 7);
    d.setHours(0, 0, 0, 0);
    const sunDate = d.getDate();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(d);
      date.setDate(sunDate + i);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
  }, [weekOffset]);

  // 주간 이벤트
  useEffect(() => {
    if (!isWeekMode) return;
    setIsLoading(true);
    weeklyReqIdRef.current += 1;
    const reqId = weeklyReqIdRef.current;
    fetchWeeklyEvents(weekDates[0], selectedChildName)
      .then((data) => {
        if (reqId === weeklyReqIdRef.current) setWeeklyData(data);
      })
      .catch(() => {})
      .finally(() => {
        if (reqId === weeklyReqIdRef.current) setIsLoading(false);
      });
  }, [isWeekMode, weekDates, selectedChildName, focusKey]);

  // 월간 마커
  useEffect(() => {
    if (isWeekMode) return;
    setIsLoading(true);
    monthlyReqIdRef.current += 1;
    const reqId = monthlyReqIdRef.current;
    fetchMonthlyMarkers(calendarMonth.year, calendarMonth.month + 1, selectedChildName)
      .then((data) => {
        if (reqId === monthlyReqIdRef.current) setMonthlyMarkers(data);
      })
      .catch(() => {})
      .finally(() => {
        if (reqId === monthlyReqIdRef.current) setIsLoading(false);
      });
  }, [isWeekMode, calendarMonth.year, calendarMonth.month, selectedChildName, focusKey]);

  // 일간 이벤트
  useEffect(() => {
    if (isWeekMode) return;
    setIsDailyLoading(true);
    dailyReqIdRef.current += 1;
    const reqId = dailyReqIdRef.current;
    fetchDailyEvents(selectedDate, selectedChildName)
      .then((result) => {
        if (reqId === dailyReqIdRef.current) setDayEvents(result.events);
      })
      .catch(() => {})
      .finally(() => {
        if (reqId === dailyReqIdRef.current) setIsDailyLoading(false);
      });
  }, [isWeekMode, selectedDate, selectedChildName, focusKey]);

  // 학사일정
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

  type SchoolDisplayEntry = {
    type: 'holiday' | 'academic';
    item: HolidayItem;
    schoolGroupKey?: string;
    childNames?: string[];
  };

  const markedDatesMap = useMemo(() => {
    const map: Record<string, { dots: { key: string; color: string }[] }> = {};
    monthlyMarkers.forEach(({ date, childName, childColor }) => {
      if (!map[date]) map[date] = { dots: [] };
      if (!map[date].dots.find((d) => d.key === childName)) {
        map[date].dots.push({ key: childName, color: childColor });
      }
    });
    // 학교 도트 병합
    const allSchoolDates = new Set<string>();
    commonHolidays.forEach((h) => allSchoolDates.add(h.date));
    schoolGroups.forEach((g) => g.schedules.forEach((s) => allSchoolDates.add(s.date)));
    allSchoolDates.forEach((date) => {
      const schoolDots = getSchoolDotsForDate(commonHolidays, schoolGroups, date);
      schoolDots.forEach((dot) => {
        if (!map[date]) map[date] = { dots: [] };
        if (!map[date].dots.find((d) => d.key === dot.key)) map[date].dots.push(dot);
      });
    });
    return map;
  }, [monthlyMarkers, commonHolidays, schoolGroups]);

  const weekMarkedDates = useMemo(() => {
    if (!weeklyData) return {};
    const record: Record<string, { dots: { key: string; color: string }[] }> = {};
    weeklyData.days.forEach((day) => {
      if (day.events.length > 0) {
        const dots: { key: string; color: string }[] = [];
        day.events.forEach((e) => {
          const key = e.childName ?? e.calendarColor;
          if (!dots.find((d) => d.key === key)) {
            dots.push({ key, color: e.calendarColor });
          }
        });
        record[day.date] = { dots };
      }
    });
    // 학교 도트 병합
    weekDates.forEach((date) => {
      const schoolDots = getSchoolDotsForDate(commonHolidays, schoolGroups, date);
      schoolDots.forEach((dot) => {
        if (!record[date]) record[date] = { dots: [] };
        if (!record[date].dots.find((d) => d.key === dot.key)) record[date].dots.push(dot);
      });
    });
    return record;
  }, [weeklyData, weekDates, commonHolidays, schoolGroups]);

  const daySchoolSchedules = useMemo(
    (): SchoolDisplayEntry[] => [
      ...getHolidaysForDate(commonHolidays, selectedDate).map((item) => ({
        type: 'holiday' as const,
        item,
      })),
      ...getAcademicSchedulesForDate(schoolGroups, selectedDate, selectedChildId).map((e) => ({
        type: 'academic' as const,
        ...e,
      })),
    ],
    [commonHolidays, schoolGroups, selectedDate, selectedChildId]
  );

  const weekDisplayGroups = useMemo(() => {
    const eventsMap: Record<string, CalendarEvent[]> = {};
    (weeklyData?.days ?? []).forEach((d) => {
      eventsMap[d.date] = d.events;
    });
    const schoolMap: Record<string, SchoolDisplayEntry[]> = {};
    weekDates.forEach((date) => {
      const holidays = getHolidaysForDate(commonHolidays, date).map((item) => ({
        type: 'holiday' as const,
        item,
      }));
      const academic = getAcademicSchedulesForDate(schoolGroups, date, selectedChildId).map(
        (e) => ({ type: 'academic' as const, ...e })
      );
      const all = [...holidays, ...academic];
      if (all.length > 0) schoolMap[date] = all;
    });
    const activeDates = new Set([
      ...(weeklyData?.days.filter((d) => d.events.length > 0).map((d) => d.date) ?? []),
      ...Object.keys(schoolMap),
    ]);
    return weekDates
      .filter((d) => activeDates.has(d))
      .map((d) => ({
        date: d,
        events: eventsMap[d] ?? [],
        schoolSchedules: schoolMap[d] ?? [],
      }));
  }, [weeklyData, weekDates, commonHolidays, schoolGroups, selectedChildId]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCheck = async (eventId: number, checklistId: number) => {
    // 현재 isCompleted 상태 파악
    let currentIsCompleted: boolean | undefined;
    const inDay = dayEvents.find((e) => e.eventId === eventId);
    if (inDay) {
      currentIsCompleted = inDay.checklists.find((c) => c.checklistId === checklistId)?.isCompleted;
    }
    if (currentIsCompleted === undefined && weeklyData) {
      const inWeek = weeklyData.days
        .flatMap((day) => day.events)
        .find((e) => e.eventId === eventId);
      currentIsCompleted = inWeek?.checklists.find(
        (c) => c.checklistId === checklistId
      )?.isCompleted;
    }
    if (currentIsCompleted === undefined) return;

    const applyToggle = (events: CalendarEvent[]) =>
      events.map((e) =>
        e.eventId !== eventId
          ? e
          : {
              ...e,
              checklists: e.checklists.map((c) =>
                c.checklistId === checklistId ? { ...c, isCompleted: !c.isCompleted } : c
              ),
            }
      );
    const applyToWeekly = (prev: typeof weeklyData) =>
      prev
        ? { ...prev, days: prev.days.map((day) => ({ ...day, events: applyToggle(day.events) })) }
        : prev;

    // 낙관적 업데이트
    setDayEvents(applyToggle);
    setWeeklyData(applyToWeekly);

    try {
      await completeChecklist(checklistId, !currentIsCompleted);
    } catch {
      // 실패 시 롤백 (다시 토글하면 원래 값으로 복구)
      setDayEvents(applyToggle);
      setWeeklyData(applyToWeekly);
    }
  };

  const handleToggleMode = () => {
    setIsWeekMode((prev) => !prev);
    setExpandedIds(new Set());
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

  return (
    <View style={styles.container}>
      {/* 헤더 */}
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

      {/* 자녀 필터바 */}
      <ChildFilterBar
        items={children}
        selectedChildName={selectedChildName}
        onSelect={setSelectedChildName}
      />

      {isWeekMode ? (
        <>
          {/* 주간 날짜 바 */}
          <WeekCalendar
            weekDates={weekDates}
            today={today}
            markedDates={weekMarkedDates}
            onPrev={() => setWeekOffset((o) => o - 1)}
            onNext={() => setWeekOffset((o) => o + 1)}
          />

          {/* 주간 일정 목록 */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[400]} />
            </View>
          ) : (
            <ScrollView
              ref={weekScrollRef}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                if (weekOffsetRef.current !== 0 || !shouldAutoScrollRef.current) return;
                requestAnimationFrame(() => {
                  if (weekOffsetRef.current !== 0 || todayGroupY.current === undefined) return;
                  weekScrollRef.current?.scrollTo({ y: todayGroupY.current, animated: false });
                  shouldAutoScrollRef.current = false;
                });
              }}
            >
              <View style={styles.weekListContent}>
                {weekDisplayGroups.length === 0 ? (
                  <Text style={styles.emptyText}>{t('calendar.emptyWeek')}</Text>
                ) : (
                  weekDisplayGroups.map((group) => (
                    <View
                      key={group.date}
                      onLayout={(e) => {
                        if (group.date === today) {
                          todayGroupY.current = e.nativeEvent.layout.y;
                        }
                      }}
                    >
                      <Text style={styles.weekDateHeader}>
                        {formatWeekDateHeader(group.date, i18n.language)}
                      </Text>
                      <View style={styles.cardGroup}>
                        {group.schoolSchedules.map((entry) => (
                          <SchoolScheduleRow
                            key={`${entry.item.date}-${entry.item.eventName}-${entry.schoolGroupKey ?? entry.type}`}
                            item={entry.item}
                            type={entry.type}
                            childNames={entry.childNames}
                          />
                        ))}
                        {group.events.map((event) => (
                          <EventCard
                            key={event.eventId}
                            event={event}
                            expanded={expandedIds.has(event.eventId)}
                            isPast={group.date < today}
                            onToggleExpand={() => toggleExpand(event.eventId)}
                            onToggleCheck={(checklistId) => toggleCheck(event.eventId, checklistId)}
                          />
                        ))}
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          )}
        </>
      ) : (
        <>
          {/* 월간 캘린더 */}
          <MonthCalendar
            year={calendarMonth.year}
            month={calendarMonth.month}
            today={today}
            selectedDate={selectedDate}
            markedDates={markedDatesMap}
            onDayPress={setSelectedDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />

          {/* 선택 날짜 + 일정 목록 */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[400]} />
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              <Text style={styles.dayLabel}>{formatDayLabel(selectedDate, i18n.language)}</Text>
              <View style={styles.listContent}>
                {isDailyLoading && <ActivityIndicator size="small" color={colors.primary[400]} />}
                {!isDailyLoading && daySchoolSchedules.length === 0 && dayEvents.length === 0 && (
                  <Text style={styles.emptyText}>{t('calendar.emptyDay')}</Text>
                )}
                {!isDailyLoading &&
                  daySchoolSchedules.map((entry) => (
                    <SchoolScheduleRow
                      key={`${entry.item.date}-${entry.item.eventName}-${entry.schoolGroupKey ?? entry.type}`}
                      item={entry.item}
                      type={entry.type}
                      childNames={entry.childNames}
                    />
                  ))}
                {!isDailyLoading &&
                  dayEvents.map((event) => (
                    <EventCard
                      key={event.eventId}
                      event={event}
                      expanded={expandedIds.has(event.eventId)}
                      isPast={selectedDate < today}
                      onToggleExpand={() => toggleExpand(event.eventId)}
                      onToggleCheck={(checklistId) => toggleCheck(event.eventId, checklistId)}
                    />
                  ))}
              </View>
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
};

export default CalendarScreen;
