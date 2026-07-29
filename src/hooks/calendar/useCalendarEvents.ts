import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchWeeklyEvents, fetchDailyEvents, completeChecklist } from '../../api/calendar';
import type { CalendarEvent, WeeklyResult, HolidayItem, SchoolGroup } from '../../api/calendar';
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
  const weeklyReqIdRef = useRef(0);
  const dailyReqIdRef = useRef(0);

  useEffect(() => {
    if (!isWeekMode) return;
    setWeekEventsLoading(true);
    weeklyReqIdRef.current += 1;
    const reqId = weeklyReqIdRef.current;
    fetchWeeklyEvents(weekDates[0], selectedChildName)
      .then((data) => {
        if (reqId === weeklyReqIdRef.current) setWeeklyData(data);
      })
      .catch(() => {})
      .finally(() => {
        if (reqId === weeklyReqIdRef.current) setWeekEventsLoading(false);
      });
  }, [isWeekMode, weekDates, selectedChildName, focusKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isWeekMode) return;
    setDailyEventsLoading(true);
    dailyReqIdRef.current += 1;
    const reqId = dailyReqIdRef.current;
    fetchDailyEvents(selectedDate, selectedChildName)
      .then((result) => {
        if (reqId === dailyReqIdRef.current) setDayEvents(result.events);
      })
      .catch(() => {})
      .finally(() => {
        if (reqId === dailyReqIdRef.current) setDailyEventsLoading(false);
      });
  }, [isWeekMode, selectedDate, selectedChildName, focusKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
    return weekDates
      .filter((d) => activeDates.has(d))
      .map((d) => ({
        date: d,
        events: eventsMap[d] ?? [],
        schoolSchedules: schoolMap[d] ?? [],
      }));
  }, [weeklyData, weekDates, commonHolidays, schoolGroups, selectedChildId]);

  const toggleCheck = async (eventId: number, checklistId: number) => {
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
    const applyToWeekly = (prev: WeeklyResult | null) =>
      prev
        ? { ...prev, days: prev.days.map((day) => ({ ...day, events: applyToggle(day.events) })) }
        : prev;

    const daySnapshot = dayEvents;
    const weekSnapshot = weeklyData;
    setDayEvents(applyToggle);
    setWeeklyData(applyToWeekly);

    try {
      await completeChecklist(checklistId, !currentIsCompleted);
    } catch {
      setDayEvents(daySnapshot);
      setWeeklyData(weekSnapshot);
    }
  };

  return {
    weeklyData,
    dayEvents,
    weekDisplayGroups,
    weekMarkedDates,
    daySchoolSchedules,
    weekEventsLoading,
    dailyEventsLoading,
    toggleCheck,
  };
};

export default useCalendarEvents;
