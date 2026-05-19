import { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/calendar/calendar';
import EventCard from '../../src/components/calendar/EventCard';
import WeekCalendar from '../../src/components/calendar/WeekCalendar';
import MonthCalendar from '../../src/components/calendar/MonthCalendar';
import {
  fetchMonthlyMarkers,
  fetchDailyEvents,
  fetchWeeklyEvents,
  fetchChildren,
  completeChecklist,
  type CalendarEvent,
  type WeeklyResult,
  type ChildInfo,
  type MonthlyMarker,
} from '../../src/api/calendar';

const todayDate = new Date();
const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const formatDayLabel = (dateStr: string) => {
  const [, month, day] = dateStr.split('-');
  return `${parseInt(month, 10)}월 ${parseInt(day, 10)}일`;
};

const formatWeekDateHeader = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return `${month}월 ${day}일 (${DAY_NAMES[d.getDay()]})`;
};

const CalendarScreen = () => {
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [selectedChildName, setSelectedChildName] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [monthlyMarkers, setMonthlyMarkers] = useState<MonthlyMarker[]>([]);
  const [dayEvents, setDayEvents] = useState<CalendarEvent[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDailyLoading, setIsDailyLoading] = useState(false);
  const [isWeekMode, setIsWeekMode] = useState<boolean>(true);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [calendarMonth, setCalendarMonth] = useState({
    year: todayDate.getFullYear(),
    month: todayDate.getMonth(),
  });

  const weekScrollRef = useRef<ScrollView>(null);
  const weekOffsetRef = useRef(weekOffset);
  const shouldAutoScrollRef = useRef(weekOffset === 0);
  weekOffsetRef.current = weekOffset;
  const todayGroupY = useRef<number | undefined>(undefined);

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

  // 자녀 목록
  useEffect(() => {
    fetchChildren()
      .then(setChildren)
      .catch(() => {});
  }, []);

  // 주간 이벤트
  useEffect(() => {
    if (!isWeekMode) return;
    setIsLoading(true);
    fetchWeeklyEvents(weekDates[0], selectedChildName)
      .then(setWeeklyData)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isWeekMode, weekDates, selectedChildName]);

  // 월간 마커
  useEffect(() => {
    if (isWeekMode) return;
    setIsLoading(true);
    fetchMonthlyMarkers(calendarMonth.year, calendarMonth.month + 1, selectedChildName)
      .then(setMonthlyMarkers)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isWeekMode, calendarMonth.year, calendarMonth.month, selectedChildName]);

  // 일간 이벤트
  useEffect(() => {
    if (isWeekMode) return;
    setIsDailyLoading(true);
    fetchDailyEvents(selectedDate, selectedChildName)
      .then((result) => setDayEvents(result.events))
      .catch(() => {})
      .finally(() => setIsDailyLoading(false));
  }, [isWeekMode, selectedDate, selectedChildName]);

  const markedDatesMap = useMemo(() => {
    const map: Record<string, { dots: { key: string; color: string }[] }> = {};
    monthlyMarkers.forEach(({ date, childName, childColor }) => {
      if (!map[date]) map[date] = { dots: [] };
      if (!map[date].dots.find((d) => d.key === childName)) {
        map[date].dots.push({ key: childName, color: childColor });
      }
    });
    return map;
  }, [monthlyMarkers]);

  const weekMarkedDates = useMemo(() => {
    if (!weeklyData) return {};
    const record: Record<string, { dots: { key: string; color: string }[] }> = {};
    weeklyData.days.forEach((day) => {
      if (day.events.length > 0) {
        record[day.date] = {
          dots: day.events.map((e) => ({ key: String(e.eventId), color: e.calendarColor })),
        };
      }
    });
    return record;
  }, [weeklyData]);

  const weekEventGroups = useMemo(() => {
    if (!weeklyData) return [];
    return weeklyData.days.filter((d) => d.events.length > 0);
  }, [weeklyData]);

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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <Ionicons name="arrow-back" size={16} color={colors.gray[300]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>캘린더</Text>
        <TouchableOpacity
          style={[styles.iconButton, styles.calendarIconButton]}
          onPress={handleToggleMode}
          accessibilityRole="button"
          accessibilityLabel={isWeekMode ? '월간 보기로 전환' : '주간 보기로 전환'}
        >
          <FontAwesome5
            name={isWeekMode ? 'calendar-alt' : 'calendar-week'}
            size={14}
            color={colors.primary[400]}
            solid
          />
        </TouchableOpacity>
      </View>

      {/* 자녀 필터바 */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[styles.filterBtn, selectedChildName === undefined && styles.filterBtnSelected]}
            onPress={() => setSelectedChildName(undefined)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                selectedChildName === undefined && styles.filterTextSelected,
              ]}
            >
              전체
            </Text>
          </TouchableOpacity>
          {children.map((child) => {
            const selected = selectedChildName === child.name;
            return (
              <TouchableOpacity
                key={child.id}
                style={[styles.filterBtn, selected && styles.filterBtnSelected]}
                onPress={() => setSelectedChildName(child.name)}
                activeOpacity={0.7}
              >
                <View style={[styles.filterDot, { backgroundColor: child.colorCode }]} />
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                  {child.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

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
                {weekEventGroups.length === 0 ? (
                  <Text style={styles.emptyText}>이번 주 일정이 없어요</Text>
                ) : (
                  weekEventGroups.map((group) => (
                    <View
                      key={group.date}
                      onLayout={(e) => {
                        if (group.date === today) {
                          todayGroupY.current = e.nativeEvent.layout.y;
                        }
                      }}
                    >
                      <Text style={styles.weekDateHeader}>{formatWeekDateHeader(group.date)}</Text>
                      <View style={styles.cardGroup}>
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
              <Text style={styles.dayLabel}>{formatDayLabel(selectedDate)}</Text>
              <View style={styles.listContent}>
                {isDailyLoading && <ActivityIndicator size="small" color={colors.primary[400]} />}
                {!isDailyLoading && dayEvents.length === 0 && (
                  <Text style={styles.emptyText}>등록된 일정이 없어요</Text>
                )}
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
