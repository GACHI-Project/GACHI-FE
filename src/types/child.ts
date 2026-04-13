import { SchoolResult } from './school';

export interface ChildInfo {
  id: string;
  name: string;
  selectedSchool: SchoolResult | null;
  schoolQuery: string;
  grade: number | null;
  calendarColor: string | null;
}
