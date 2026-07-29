import { useState, useEffect, useMemo } from 'react';
import {
  fetchSchoolMeals,
  getMealsForChild,
  fetchSchoolTimetables,
  getPeriodsForChild,
} from '../../api/meal';
import type {
  SchoolMealGroup,
  SchoolTimetableGroup,
  MealMenu,
  TimetablePeriod,
} from '../../api/meal';
import type { ChildItem } from '../../api/child';
import { fmt, getDisplayWeekDays, getNextWeekdays } from '../../utils/date';

export type TimetableDay = { date: Date; periods: TimetablePeriod[] };
export type MealDay = { date: Date; menus: MealMenu[] };

const useMealTimetable = (childItems: ChildItem[], selectedChild: ChildItem | undefined) => {
  const [schoolTimetables, setSchoolTimetables] = useState<SchoolTimetableGroup[]>([]);
  const [schoolMeals, setSchoolMeals] = useState<SchoolMealGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const weekDays = useMemo(() => getDisplayWeekDays(), []);
  const mealDays = useMemo(() => getNextWeekdays(5), []);

  useEffect(() => {
    let cancelled = false;
    if (childItems.length) {
      setLoading(true);
      const ttFrom = fmt(weekDays[0]);
      const ttTo = fmt(weekDays[4]);
      const mealFrom = fmt(mealDays[0]);
      const mealTo = fmt(mealDays[mealDays.length - 1]);
      Promise.all([
        fetchSchoolTimetables(ttFrom, ttTo).catch(() => [] as SchoolTimetableGroup[]),
        fetchSchoolMeals(mealFrom, mealTo).catch(() => [] as SchoolMealGroup[]),
      ])
        .then(([tt, meals]) => {
          if (cancelled) return;
          setSchoolTimetables(tt);
          setSchoolMeals(meals);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [childItems, weekDays, mealDays]);

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

  return { timetableByDay, mealsByDay, periodCount, loading };
};

export default useMealTimetable;
