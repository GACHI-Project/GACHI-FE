import { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import colors from '../../src/constants/colors';
import { MOCK_CAL_CHILDREN, MOCK_EVENTS } from '../../src/mock/calendar';
import type { CalendarEvent } from '../../src/mock/calendar';
import styles from '../../src/styles/calendar/calendar';
import EventCard from '../../src/components/calendar/EventCard';
import WeekCalendar from '../../src/components/calendar/WeekCalendar';
import MonthCalendar from '../../src/components/calendar/MonthCalendar';

const todayDate = new Date();
const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const calcDDay = (dateStr: string): number => {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  return Math.round((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
};

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
  const [selectedChildId, setSelectedChildId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS);
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

  const filteredByChild = useMemo(
    () => events.filter((e) => selectedChildId === 'all' || e.childId === selectedChildId),
    [events, selectedChildId]
  );

  const dayEvents = useMemo(
    () => filteredByChild.filter((e) => e.date === selectedDate),
    [filteredByChild, selectedDate]
  );

  const markedDates = useMemo(() => {
    const marks: Record<string, { dots: { key: string; color: string }[] }> = {};
    filteredByChild.forEach((event) => {
      if (!marks[event.date]) marks[event.date] = { dots: [] };
      if (!marks[event.date].dots.find((d) => d.key === event.childId)) {
        marks[event.date].dots.push({ key: event.childId, color: event.calendarColor });
      }
    });
    return marks;
  }, [filteredByChild]);

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

  const weekEventGroups = useMemo(() => {
    const dateSet = new Set(weekDates);
    const sorted = filteredByChild
      .filter((e) => dateSet.has(e.date))
      .sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        return calcDDay(a.date) - calcDDay(b.date);
      });
    const groups: { date: string; events: CalendarEvent[] }[] = [];
    sorted.forEach((event) => {
      const last = groups[groups.length - 1];
      if (last && last.date === event.date) {
        last.events.push(event);
      } else {
        groups.push({ date: event.date, events: [event] });
      }
    });
    return groups;
  }, [filteredByChild, weekDates]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCheck = (eventId: string, checkId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id !== eventId
          ? e
          : {
              ...e,
              checkList: e.checkList.map((c) => (c.id === checkId ? { ...c, done: !c.done } : c)),
            }
      )
    );
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
            style={[styles.filterBtn, selectedChildId === 'all' && styles.filterBtnSelected]}
            onPress={() => setSelectedChildId('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.filterText, selectedChildId === 'all' && styles.filterTextSelected]}
            >
              전체
            </Text>
          </TouchableOpacity>
          {MOCK_CAL_CHILDREN.map((child) => {
            const selected = selectedChildId === child.id;
            return (
              <TouchableOpacity
                key={child.id}
                style={[styles.filterBtn, selected && styles.filterBtnSelected]}
                onPress={() => setSelectedChildId(child.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.filterDot, { backgroundColor: child.calendarColor }]} />
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
            markedDates={markedDates}
            onPrev={() => setWeekOffset((o) => o - 1)}
            onNext={() => setWeekOffset((o) => o + 1)}
          />

          {/* 주간 일정 목록 */}
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
                          key={event.id}
                          event={event}
                          expanded={expandedIds.has(event.id)}
                          isPast={event.date < today}
                          onToggleExpand={() => toggleExpand(event.id)}
                          onToggleCheck={(checkId) => toggleCheck(event.id, checkId)}
                        />
                      ))}
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </>
      ) : (
        <>
          {/* 월간 캘린더 */}
          <MonthCalendar
            year={calendarMonth.year}
            month={calendarMonth.month}
            today={today}
            selectedDate={selectedDate}
            markedDates={markedDates}
            onDayPress={setSelectedDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />

          {/* 선택 날짜 + 일정 목록 */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            <Text style={styles.dayLabel}>{formatDayLabel(selectedDate)}</Text>
            <View style={styles.listContent}>
              {dayEvents.length === 0 ? (
                <Text style={styles.emptyText}>등록된 일정이 없어요</Text>
              ) : (
                dayEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    expanded={expandedIds.has(event.id)}
                    isPast={event.date < today}
                    onToggleExpand={() => toggleExpand(event.id)}
                    onToggleCheck={(checkId) => toggleCheck(event.id, checkId)}
                  />
                ))
              )}
            </View>
          </ScrollView>
        </>
      )}
    </View>
  );
};

export default CalendarScreen;
