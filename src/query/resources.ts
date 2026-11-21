import { fetchSchoolSchedules } from '../api/calendar';
import { fetchChildren } from '../api/child';
import { fetchSchoolMeals, fetchSchoolTimetables } from '../api/meal';
import { fetchMyInfo } from '../api/user';
import { getUnreadTotal } from '../utils/unreadCount';
import { useServerQuery } from './hooks';

export const useChildrenQuery = () =>
  useServerQuery('children', [], (signal) => fetchChildren(signal));
export const useProfileQuery = () => useServerQuery('profile', [], (signal) => fetchMyInfo(signal));
export const useUnreadQuery = () =>
  useServerQuery('unread', [], (signal) => getUnreadTotal(signal), { staleTime: 0 });
export const useMealsQuery = (from: string, to: string, enabled = true) =>
  useServerQuery('meals', [from, to], (signal) => fetchSchoolMeals(from, to, signal), {
    enabled,
    staleTime: 300000,
  });
export const useTimetablesQuery = (from: string, to: string, enabled = true) =>
  useServerQuery('timetables', [from, to], (signal) => fetchSchoolTimetables(from, to, signal), {
    enabled,
    staleTime: 300000,
  });
export const useSchoolSchedulesQuery = (from: string, to: string) =>
  useServerQuery('schoolSchedules', [from, to], (signal) => fetchSchoolSchedules(from, to, signal));
