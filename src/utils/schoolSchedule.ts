import colors from '../constants/colors';
import type { HolidayItem, SchoolGroup, GradeEventYn } from '../api/calendar';

const GRADE_KEYS: Record<number, keyof GradeEventYn> = {
  1: 'grade1',
  2: 'grade2',
  3: 'grade3',
  4: 'grade4',
  5: 'grade5',
  6: 'grade6',
};

const gradeMatches = (item: HolidayItem, grade: number): boolean => {
  const key = GRADE_KEYS[grade];
  return key ? item.gradeEventYn[key] === 'Y' : false;
};

export interface ScheduleEntry {
  item: HolidayItem;
  schoolGroupKey?: string;
  childNames?: string[];
}

export const getHolidaysForDate = (commonHolidays: HolidayItem[], date: string): HolidayItem[] =>
  commonHolidays.filter((h) => h.date === date);

export const getAcademicSchedulesForDate = (
  groups: SchoolGroup[],
  date: string,
  selectedChildId: number | undefined
): ScheduleEntry[] => {
  const result: ScheduleEntry[] = [];
  const multiGroup = groups.length > 1;

  if (selectedChildId === undefined) {
    const seen = new Set<string>();
    groups.forEach((group) => {
      group.schedules
        .filter((s) => s.date === date)
        .forEach((s) => {
          const anyMatch = group.children.some((c) => gradeMatches(s, c.grade));
          const key = `${group.schoolGroupKey}:${s.date}:${s.eventName}`;
          if (anyMatch && !seen.has(key)) {
            seen.add(key);
            const matchingNames = group.children
              .filter((c) => gradeMatches(s, c.grade))
              .map((c) => c.childName);
            result.push({
              item: s,
              schoolGroupKey: multiGroup ? group.schoolGroupKey : undefined,
              childNames: multiGroup ? matchingNames : undefined,
            });
          }
        });
    });
  } else {
    groups.forEach((group) => {
      if (!group.childIds.includes(selectedChildId)) return;
      const childInGroup = group.children.find((c) => c.childId === selectedChildId);
      if (!childInGroup) return;
      group.schedules
        .filter((s) => s.date === date)
        .forEach((s) => {
          if (gradeMatches(s, childInGroup.grade)) result.push({ item: s });
        });
    });
  }

  return result;
};

export const getSchoolDotsForDate = (
  commonHolidays: HolidayItem[],
  groups: SchoolGroup[],
  date: string
): { key: string; color: string }[] => {
  const hasAny =
    commonHolidays.some((h) => h.date === date) ||
    groups.some((g) => g.schedules.some((s) => s.date === date));
  return hasAny ? [{ key: 'school', color: colors.gray[300] }] : [];
};
