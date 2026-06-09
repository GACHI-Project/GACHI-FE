import axios from 'axios';
import { apiClient } from './auth';

const wrapError = (error: unknown): Error => {
  if (axios.isAxiosError(error) && error.response?.data?.code) {
    return new Error(error.response.data.message ?? '알 수 없는 오류');
  }
  return error instanceof Error ? error : new Error(String(error));
};

export interface MealMenu {
  name: string;
  allergyNums: number[];
}

export interface SchoolMealChild {
  childId: number;
  childName: string;
  grade: number;
  colorCode: string;
}

export interface SchoolMealEntry {
  date: string;
  mealCode: string;
  mealName: string;
  mealPeopleCount: number;
  dishName: string;
  originInfo: string;
  calorieInfo: string;
  nutritionInfo: string;
}

export interface SchoolMealGroup {
  schoolGroupKey: string;
  officeCode: string;
  schoolCode: string;
  schoolName: string;
  childIds: number[];
  children: SchoolMealChild[];
  meals: SchoolMealEntry[];
}

const parseDishLine = (dish: string): MealMenu => {
  const cleaned = dish
    .replace(/\*/g, '')
    .replace(/\(현\)/g, '')
    .trim();
  const match = cleaned.match(/^(.*)\s*\(([\d.]+)\)\s*$/);
  if (match) {
    return {
      name: match[1].trim(),
      allergyNums: match[2]
        .split('.')
        .map(Number)
        .filter((n) => !Number.isNaN(n) && n > 0),
    };
  }
  return { name: cleaned, allergyNums: [] };
};

export const parseDishName = (dishName: string): MealMenu[] =>
  dishName
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseDishLine);

export const fetchSchoolMeals = async (
  fromDate: string,
  toDate: string
): Promise<SchoolMealGroup[]> => {
  try {
    const response = await apiClient.get('/api/v1/calendars/school-meals', {
      params: { fromDate, toDate },
    });
    return response.data.result.schoolMeals ?? [];
  } catch (error) {
    throw wrapError(error);
  }
};

export const getMealsForChild = (
  schoolMeals: SchoolMealGroup[],
  officeCode: string,
  schoolCode: string,
  date: string
): MealMenu[] => {
  const group = schoolMeals.find((g) => g.officeCode === officeCode && g.schoolCode === schoolCode);
  if (!group) return [];
  const entry =
    group.meals.find(
      (m) => m.date === date && (m.mealCode === '2' || m.mealName.includes('중식'))
    ) ?? group.meals.find((m) => m.date === date);
  if (!entry?.dishName) return [];
  return parseDishName(entry.dishName);
};

export interface TimetablePeriod {
  period: number;
  subject: string;
}

export interface SchoolTimetableEntry {
  date: string;
  academicYear: string;
  semester: string;
  grade: number;
  className: string;
  period: number;
  content: string;
}

export interface SchoolTimetableGroup {
  schoolGroupKey: string;
  officeCode: string;
  schoolCode: string;
  schoolName: string;
  childIds: number[];
  children: SchoolMealChild[];
  timetables: SchoolTimetableEntry[];
}

export const fetchSchoolTimetables = async (
  fromDate: string,
  toDate: string
): Promise<SchoolTimetableGroup[]> => {
  try {
    const response = await apiClient.get('/api/v1/calendars/elementary-timetables', {
      params: { fromDate, toDate },
    });
    return response.data.result.schoolTimetables ?? [];
  } catch (error) {
    throw wrapError(error);
  }
};

export const getPeriodsForChild = (
  schoolTimetables: SchoolTimetableGroup[],
  officeCode: string,
  schoolCode: string,
  grade: number,
  className: string | null,
  date: string
): TimetablePeriod[] => {
  const group = schoolTimetables.find(
    (g) => g.officeCode === officeCode && g.schoolCode === schoolCode
  );
  if (!group) return [];
  return group.timetables
    .filter(
      (t) => t.date === date && t.grade === grade && (!className || t.className === className)
    )
    .sort((a, b) => a.period - b.period)
    .map((t) => ({ period: t.period, subject: t.content }));
};
