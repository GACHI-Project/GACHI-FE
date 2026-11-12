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
  const deletedEventIdsRef = useRef<Set<number>>(new Set());
  const weekReferenceDate = getWeeklyQueryDate(weekDates);
  const eventQueryDate = isWeekMode ? weekReferenceDate : selectedDate;
  const mutationScopeRef = useRef<object | null>(null);
  const pendingChecklistIdsRef = useRef(new Set<number>());
  const weeklyQueryRef = useRef<{ date: string; childName: string | undefined } | null>(null);

  useEffect(() => {
    mutationScopeRef.current = {};
    return () => {
      mutationScopeRef.current = null;
    };
  }, [isWeekMode, eventQueryDate, selectedChildName, focusKey]);

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
    fetchWeeklyEvents(weekReferenceDate, selectedChildName)
      .then((data) => {
        if (cancelled || reqId !== weeklyReqIdRef.current) return;
        if (deletedEventIdsRef.current.size === 0) {
          setWeeklyData(data);
          return;
        }
        setWeeklyData({
          ...data,
          days: data.days.map((day) => ({
            ...day,
            events: day.events.filter((e) => !deletedEventIdsRef.current.has(e.eventId)),
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
    fetchDailyEvents(selectedDate, selectedChildName)
      .then((result) => {
        if (!cancelled && reqId === dailyReqIdRef.current) {
          setDayEvents(
            result.events.filter((event) => !deletedEventIdsRef.current.has(event.eventId))
          );
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
    const scope = mutationScopeRef.current;
    if (!scope || pendingChecklistIdsRef.current.has(checklistId)) return;
    const events = isWeekMode ? weeklyData?.days.flatMap((day) => day.events) : dayEvents;
    const target = events
      ?.find((event) => event.eventId === eventId)
      ?.checklists.find((item) => item.checklistId === checklistId);
    if (!target) return;

    pendingChecklistIdsRef.current.add(checklistId);
    const dayRequestId = dailyReqIdRef.current;
    const weekRequestId = weeklyReqIdRef.current;
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

    updateDay(!target.isCompleted);
    updateWeek(!target.isCompleted);
    try {
      await completeChecklist(checklistId, !target.isCompleted);
    } catch {
      if (mutationScopeRef.current !== scope) return;
      if (dayRequestId === dailyReqIdRef.current) updateDay(target.isCompleted);
      if (weekRequestId === weeklyReqIdRef.current) updateWeek(target.isCompleted);
    } finally {
      pendingChecklistIdsRef.current.delete(checklistId);
    }
  };

  const deleteEvent = async (eventId: number) => {
    await deleteCalendarEvent(eventId);
    deletedEventIdsRef.current.add(eventId);
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
