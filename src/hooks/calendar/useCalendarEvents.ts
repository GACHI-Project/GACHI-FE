import { useMemo } from 'react';
import type { CalendarEvent, HolidayItem, SchoolGroup } from '../../api/calendar';
import { fetchDailyEvents, fetchWeeklyEvents } from '../../api/calendar';
import { changeChecklist, removeCalendarEvent } from '../../query/checklists';
import { useApiMutation, useServerQuery } from '../../query/hooks';
import { getWeeklyQueryDate, orderWeekDates } from '../../utils/calendarWeek';
import {
  getAcademicSchedulesForDate,
  getHolidaysForDate,
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

  commonHolidays: HolidayItem[];
  schoolGroups: SchoolGroup[];
}

const useCalendarEvents = ({
  isWeekMode,
  weekDates,
  selectedDate,
  selectedChildName,
  selectedChildId,

  commonHolidays,
  schoolGroups,
}: Params) => {
  const weekReferenceDate = getWeeklyQueryDate(weekDates);
  const weekly = useServerQuery(
    'calendar',
    ['week', weekReferenceDate, selectedChildName],
    (signal) => fetchWeeklyEvents(weekReferenceDate, selectedChildName, signal),
    { enabled: isWeekMode }
  );
  const daily = useServerQuery(
    'calendar',
    ['day', selectedDate, selectedChildName],
    (signal) => fetchDailyEvents(selectedDate, selectedChildName, signal),
    { enabled: !isWeekMode }
  );
  const weeklyData = weekly.data ?? null;
  const dayEvents = daily.data?.events ?? [];
  const weekEventsLoading = weekly.isLoading;
  const dailyEventsLoading = daily.isLoading;
  const dailyEventsError = daily.isError;
  const mutateChecklist = useApiMutation(changeChecklist);
  const deleteEvent = useApiMutation(removeCalendarEvent);

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
    const events = isWeekMode ? weeklyData?.days.flatMap((day) => day.events) : dayEvents;
    const target = events
      ?.find((event) => event.eventId === eventId)
      ?.checklists.find((item) => item.checklistId === checklistId);
    if (!target) return;
    try {
      await mutateChecklist(checklistId, target.isCompleted, !target.isCompleted);
    } catch {
      /* The shared cache restores only the failed item. */
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
    dailyEventsError,
    toggleCheck,
    deleteEvent,
  };
};

export default useCalendarEvents;
