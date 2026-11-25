import type { ChildItem } from '../api/child';
import { fetchClasses, fetchSchoolDetails } from '../api/school';
import type { SchoolIdentity, SchoolResult } from '../types/school';
import { isCurrentSession } from '../utils/authSession';
import { toChildInfo } from '../utils/child';
import { queryClient } from './client';
import { serverOptions, type QueryScope } from './options';

const SCHOOL_STALE_TIME = 5 * 60_000;

export const canFetchSchoolDetails = (school: SchoolIdentity | null): school is SchoolIdentity => {
  const length = school?.schoolName.trim().length ?? 0;
  return !!school?.schoolCode && !!school.officeCode && length >= 2 && length <= 50;
};

export const schoolDetailsOptions = (scope: QueryScope, school: SchoolIdentity | null) => ({
  ...serverOptions(
    scope,
    'schools',
    ['detail', school?.officeCode, school?.schoolCode, school?.schoolName.trim()],
    (signal) => (school ? fetchSchoolDetails(school, signal) : Promise.resolve(null))
  ),
  staleTime: SCHOOL_STALE_TIME,
});

export const cacheSchoolDetails = (scope: QueryScope, school: SchoolResult | null) => {
  if (
    isCurrentSession(scope.version) &&
    canFetchSchoolDetails(school) &&
    school?.roadAddress.trim()
  ) {
    queryClient.setQueryData(schoolDetailsOptions(scope, school).queryKey, school);
  }
};

export const schoolClassesResource = (school: SchoolIdentity | null, grade: number | null) => ({
  params: ['classes', school?.officeCode, school?.schoolCode, grade],
  fetch: (signal: AbortSignal) =>
    school && grade !== null
      ? fetchClasses(school.officeCode, school.schoolCode, grade, signal)
      : Promise.resolve([]),
  options: {
    public: true,
    enabled:
      !!school?.schoolCode &&
      !!school.officeCode &&
      grade !== null &&
      Number.isInteger(grade) &&
      grade >= 1 &&
      grade <= 6,
    staleTime: SCHOOL_STALE_TIME,
  },
});

export const schoolClassesOptions = (
  scope: QueryScope,
  school: SchoolIdentity | null,
  grade: number | null
) => {
  const { params, fetch, options } = schoolClassesResource(school, grade);
  return {
    ...serverOptions(scope, 'schools', params, fetch),
    enabled: options.enabled,
    staleTime: options.staleTime,
  };
};

export const prefetchChildSchoolData = (scope: QueryScope, children: ChildItem[]) => {
  if (!isCurrentSession(scope.version)) return Promise.resolve([]);
  return Promise.all(
    children.flatMap((child) => {
      const school = toChildInfo(child).selectedSchool;
      if (!school?.schoolCode || !school.officeCode) return [];
      const requests = [];
      const details = schoolDetailsOptions(scope, school);
      if (school.roadAddress.trim()) {
        cacheSchoolDetails(scope, school);
      } else if (canFetchSchoolDetails(school)) {
        requests.push(queryClient.prefetchQuery(details));
      }
      const classes = schoolClassesOptions(scope, school, child.grade);
      if (classes.enabled) {
        requests.push(queryClient.prefetchQuery(classes));
      }
      return requests;
    })
  );
};
