import { useMemo } from 'react';
import type { ChildItem } from '../../api/child';
import type { MealMenu, TimetablePeriod } from '../../api/meal';
import { getMealsForChild, getPeriodsForChild } from '../../api/meal';
import { useMealsQuery, useTimetablesQuery } from '../../query/resources';
import { fmt, getDisplayWeekDays, getNextWeekdays } from '../../utils/date';
import useCurrentDate from '../useCurrentDate';

export type TimetableDay = { date: Date; periods: TimetablePeriod[] };
export type MealDay = { date: Date; menus: MealMenu[] };

const useMealTimetable = (childItems: ChildItem[], selectedChild: ChildItem | undefined) => {
  const today = useCurrentDate();
  const weekDays = useMemo(() => getDisplayWeekDays(new Date(`${today}T12:00:00`)), [today]);
  const mealDays = useMemo(() => getNextWeekdays(5, new Date(`${today}T12:00:00`)), [today]);
  const timetableQuery = useTimetablesQuery(
    fmt(weekDays[0]),
    fmt(weekDays[4]),
    !!childItems.length
  );
  const mealQuery = useMealsQuery(
    fmt(mealDays[0]),
    fmt(mealDays[mealDays.length - 1]),
    !!childItems.length
  );
  const schoolTimetables = useMemo(() => timetableQuery.data ?? [], [timetableQuery.data]);
  const schoolMeals = useMemo(() => mealQuery.data ?? [], [mealQuery.data]);
  const loading = timetableQuery.isLoading || mealQuery.isLoading;

  const timetableByDay = useMemo((): TimetableDay[] => {
    if (!selectedChild) return [];
    return weekDays.map((d) => ({
      date: d,
      periods: getPeriodsForChild(
        schoolTimetables,
        selectedChild.officeCode,
        selectedChild.schoolCode,
        selectedChild.grade,
        selectedChild.className ?? null,
        fmt(d)
      ),
    }));
  }, [schoolTimetables, selectedChild, weekDays]);

  const mealsByDay = useMemo((): MealDay[] => {
    if (!selectedChild) return [];
    return mealDays.map((d) => ({
      date: d,
      menus: getMealsForChild(
        schoolMeals,
        selectedChild.officeCode,
        selectedChild.schoolCode,
        fmt(d)
      ),
    }));
  }, [schoolMeals, selectedChild, mealDays]);

  const periodCount = useMemo(() => {
    const allPeriods = timetableByDay.flatMap((d) => d.periods.map((p) => p.period));
    return Math.max(0, ...allPeriods, 6);
  }, [timetableByDay]);

  return {
    timetableByDay,
    mealsByDay,
    periodCount,
    loading,
    timetableError: timetableQuery.isError,
    mealError: mealQuery.isError,
  };
};

export default useMealTimetable;
