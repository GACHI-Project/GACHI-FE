import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchMonthlyMarkers } from '../../api/calendar';
import type { MonthlyMarker, HolidayItem, SchoolGroup } from '../../api/calendar';
import { getSchoolDotsForDate } from '../../utils/schoolSchedule';

interface Params {
  isWeekMode: boolean;
  calendarMonth: { year: number; month: number };
  selectedChildName: string | undefined;
  focusKey: number;
  commonHolidays: HolidayItem[];
  schoolGroups: SchoolGroup[];
}

const useCalendarMarkers = ({
  isWeekMode,
  calendarMonth,
  selectedChildName,
  focusKey,
  commonHolidays,
  schoolGroups,
}: Params) => {
  const [monthlyMarkers, setMonthlyMarkers] = useState<MonthlyMarker[]>([]);
  const [markersLoading, setMarkersLoading] = useState(false);
  const monthlyReqIdRef = useRef(0);

  useEffect(() => {
    if (isWeekMode) return;
    setMarkersLoading(true);
    monthlyReqIdRef.current += 1;
    const reqId = monthlyReqIdRef.current;
    fetchMonthlyMarkers(calendarMonth.year, calendarMonth.month + 1, selectedChildName)
      .then((data) => {
        if (reqId === monthlyReqIdRef.current) setMonthlyMarkers(data);
      })
      .catch(() => {})
      .finally(() => {
        if (reqId === monthlyReqIdRef.current) setMarkersLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWeekMode, calendarMonth.year, calendarMonth.month, selectedChildName, focusKey]);

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
