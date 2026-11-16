import { useState, useEffect, useMemo, useRef } from 'react';
import {
  fetchWeeklyEvents,
  fetchDailyEvents,
  completeChecklist,
  deleteCalendarEvent,
} from '../../api/calendar';
import type { CalendarEvent, WeeklyResult, HolidayItem, SchoolGroup } from '../../api/calendar';
import { getWeeklyQueryDate, orderWeekDates } from '../../utils/calendarWeek';
import {
  getHolidaysForDate,
  getAcademicSchedulesForDate,
  getSchoolDotsForDate,
} from '../../utils/schoolSchedule';

export type SchoolDisplayEntry = {
  type: 'holiday' | 'academic';
  item: HolidayItem;
  schoolGroupKey?: string;
  childNames?: string[];
};

export type WeekDisplayGroup = {
  date: string;
  events: CalendarEvent[];
  schoolSchedules: SchoolDisplayEntry[];
};

// 진행 중인 체크리스트 변경: 낙관적 값과 진행 중에 마지막으로 관측한 서버 값
type PendingChecklist = { value: boolean; serverValue: boolean };
// 성공한 체크리스트 변경: 이보다 먼저 시작된 조회 응답이 덮어쓰지 않도록 확정 순번을 기록
type ConfirmedChecklist = { value: boolean; seq: number };

type LocalChanges = {
  deletedEventIds: Set<number>;
  pendingChecklists: Map<number, PendingChecklist>;
  confirmedChecklists: Map<number, ConfirmedChecklist>;
};

// 조회 응답에 삭제된 일정과, 진행 중이거나 조회 시작 이후 확정된 체크리스트 변경을 반영
const applyLocalChanges = (
  events: CalendarEvent[],
  fetchSeq: number,
  { deletedEventIds, pendingChecklists, confirmedChecklists }: LocalChanges
) =>
  events
    .filter((event) => !deletedEventIds.has(event.eventId))
    .map((event) => {
      let changed = false;
      const checklists = event.checklists.map((item) => {
        const pending = pendingChecklists.get(item.checklistId);
        let value = item.isCompleted;
        if (pending) {
          pending.serverValue = item.isCompleted;
          value = pending.value;
        } else {
          const confirmed = confirmedChecklists.get(item.checklistId);
          if (confirmed && confirmed.seq > fetchSeq) value = confirmed.value;
        }
        if (value === item.isCompleted) return item;
        changed = true;
        return { ...item, isCompleted: value };
      });
      return changed ? { ...event, checklists } : event;
    });

interface Params {
  isWeekMode: boolean;
  weekDates: string[];
  selectedDate: string;
  selectedChildName: string | undefined;
  selectedChildId: number | undefined;
  focusKey: number;
  commonHolidays: HolidayItem[];
  schoolGroups: SchoolGroup[];
}

const useCalendarEvents = ({
  isWeekMode,
  weekDates,
  selectedDate,
  selectedChildName,
  selectedChildId,
  focusKey,
  commonHolidays,
  schoolGroups,
}: Params) => {
  const [weeklyData, setWeeklyData] = useState<WeeklyResult | null>(null);
  const [dayEvents, setDayEvents] = useState<CalendarEvent[]>([]);
  const [weekEventsLoading, setWeekEventsLoading] = useState(false);
  const [dailyEventsLoading, setDailyEventsLoading] = useState(false);
  const [dailyEventsError, setDailyEventsError] = useState(false);
  const weeklyReqIdRef = useRef(0);
  const dailyReqIdRef = useRef(0);
  const localChangesRef = useRef<LocalChanges>({
    deletedEventIds: new Set(),
    pendingChecklists: new Map(),
    confirmedChecklists: new Map(),
  });
  const checklistSeqRef = useRef(0);
  const weekReferenceDate = getWeeklyQueryDate(weekDates);
  const weeklyQueryRef = useRef<{ date: string; childName: string | undefined } | null>(null);

  useEffect(() => {
    if (!isWeekMode) return undefined;
    let cancelled = false;
    const previousQuery = weeklyQueryRef.current;
    if (
      !previousQuery ||
      previousQuery.date !== weekReferenceDate ||
      previousQuery.childName !== selectedChildName
    ) {
      setWeeklyData(null);
    }
    weeklyQueryRef.current = { date: weekReferenceDate, childName: selectedChildName };
    setWeekEventsLoading(true);
    weeklyReqIdRef.current += 1;
    const reqId = weeklyReqIdRef.current;
    const fetchSeq = checklistSeqRef.current;
    fetchWeeklyEvents(weekReferenceDate, selectedChildName)
      .then((data) => {
        if (cancelled || reqId !== weeklyReqIdRef.current) return;
        setWeeklyData({
          ...data,
          days: data.days.map((day) => ({
            ...day,
            events: applyLocalChanges(day.events, fetchSeq, localChangesRef.current),
          })),
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled && reqId === weeklyReqIdRef.current) setWeekEventsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isWeekMode, weekReferenceDate, selectedChildName, focusKey]);

  useEffect(() => {
    if (isWeekMode) return undefined;
    let cancelled = false;
    setDayEvents([]);
    setDailyEventsError(false);
    setDailyEventsLoading(true);
    dailyReqIdRef.current += 1;
    const reqId = dailyReqIdRef.current;
    const fetchSeq = checklistSeqRef.current;
    fetchDailyEvents(selectedDate, selectedChildName)
      .then((result) => {
        if (!cancelled && reqId === dailyReqIdRef.current) {
          setDayEvents(applyLocalChanges(result.events, fetchSeq, localChangesRef.current));
        }
      })
      .catch(() => {
        if (!cancelled && reqId === dailyReqIdRef.current) setDailyEventsError(true);
      })
      .finally(() => {
        if (!cancelled && reqId === dailyReqIdRef.current) setDailyEventsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isWeekMode, selectedDate, selectedChildName, focusKey]);

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

  const weekDisplayGroups = useMemo((): WeekDisplayGroup[] => {
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
    return orderWeekDates(weekDates, weekReferenceDate)
      .filter((d) => activeDates.has(d))
      .map((d) => ({
        date: d,
        events: eventsMap[d] ?? [],
        schoolSchedules: schoolMap[d] ?? [],
      }));
  }, [weeklyData, weekDates, weekReferenceDate, commonHolidays, schoolGroups, selectedChildId]);

  const toggleCheck = async (eventId: number, checklistId: number) => {
    const { pendingChecklists, confirmedChecklists } = localChangesRef.current;
    if (pendingChecklists.has(checklistId)) return;
    const events = isWeekMode ? weeklyData?.days.flatMap((day) => day.events) : dayEvents;
    const target = events
      ?.find((event) => event.eventId === eventId)
      ?.checklists.find((item) => item.checklistId === checklistId);
    if (!target) return;

    const nextValue = !target.isCompleted;
    const pending: PendingChecklist = { value: nextValue, serverValue: target.isCompleted };
    pendingChecklists.set(checklistId, pending);
    const updateEvents = (list: CalendarEvent[], value: boolean) =>
      list.map((event) =>
        event.eventId !== eventId
          ? event
          : {
              ...event,
              checklists: event.checklists.map((item) =>
                item.checklistId === checklistId ? { ...item, isCompleted: value } : item
              ),
            }
      );
    const updateDay = (value: boolean) => setDayEvents((prev) => updateEvents(prev, value));
    const updateWeek = (value: boolean) =>
      setWeeklyData((prev) =>
        prev
          ? {
              ...prev,
              days: prev.days.map((day) => ({ ...day, events: updateEvents(day.events, value) })),
            }
          : prev
      );

    updateDay(nextValue);
    updateWeek(nextValue);
    try {
      await completeChecklist(checklistId, nextValue);
      checklistSeqRef.current += 1;
      confirmedChecklists.set(checklistId, { value: nextValue, seq: checklistSeqRef.current });
    } catch {
      // 화면 요청이 바뀌었더라도 표시 중인 낙관적 값은 마지막으로 관측한 서버 값으로 되돌림
      updateDay(pending.serverValue);
      updateWeek(pending.serverValue);
    } finally {
      pendingChecklists.delete(checklistId);
    }
  };

  const deleteEvent = async (eventId: number) => {
    await deleteCalendarEvent(eventId);
    localChangesRef.current.deletedEventIds.add(eventId);
    setDayEvents((prev) => prev.filter((e) => e.eventId !== eventId));
    setWeeklyData((prev) =>
      prev
        ? {
            ...prev,
            days: prev.days.map((day) => ({
              ...day,
              events: day.events.filter((e) => e.eventId !== eventId),
            })),
          }
        : prev
    );
  };

  return {
    weeklyData,
    dayEvents,
    weekDisplayGroups,
    weekMarkedDates,
    daySchoolSchedules,
    weekEventsLoading,
    dailyEventsLoading,
    dailyEventsError,
    toggleCheck,
    deleteEvent,
  };
};

export default useCalendarEvents;
