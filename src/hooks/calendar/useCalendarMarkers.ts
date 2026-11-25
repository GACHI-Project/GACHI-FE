import { useMemo } from 'react';
import type { HolidayItem, SchoolGroup } from '../../api/calendar';
import { fetchMonthlyMarkers } from '../../api/calendar';
import { useServerQuery } from '../../query/hooks';
import { getSchoolDotsForDate } from '../../utils/schoolSchedule';

interface Params {
  isWeekMode: boolean;
  calendarMonth: { year: number; month: number };
  selectedChildName: string | undefined;

  commonHolidays: HolidayItem[];
  schoolGroups: SchoolGroup[];
}

const useCalendarMarkers = ({
  isWeekMode,
  calendarMonth,
  selectedChildName,

  commonHolidays,
  schoolGroups,
}: Params) => {
  const query = useServerQuery(
    'markers',
    [calendarMonth.year, calendarMonth.month + 1, selectedChildName],
    (signal) =>
      fetchMonthlyMarkers(calendarMonth.year, calendarMonth.month + 1, selectedChildName, signal),
    { enabled: !isWeekMode }
  );
  const monthlyMarkers = useMemo(() => query.data ?? [], [query.data]);
  const markersLoading = query.isLoading;

  const markedDatesMap = useMemo(() => {
    const map: Record<string, { dots: { key: string; color: string }[] }> = {};
    monthlyMarkers.forEach(({ date, childName, childColor }) => {
      if (!map[date]) map[date] = { dots: [] };
      if (!map[date].dots.find((d) => d.key === childName)) {
        map[date].dots.push({ key: childName, color: childColor });
      }
    });
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

  return { monthlyMarkers, markedDatesMap, markersLoading };
};

export default useCalendarMarkers;
