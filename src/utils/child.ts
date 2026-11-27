import type { ChildItem } from '../api/child';
import type { ChildInfo } from '../types/child';

export const toChildInfo = (child: ChildItem): ChildInfo => ({
  id: String(child.id),
  name: child.name,
  selectedSchool: {
    schoolCode: child.schoolCode,
    schoolName: child.schoolName,
    englishSchoolName: '',
    schoolKind: '',
    officeCode: child.officeCode,
    officeName: '',
    locationName: child.locationName ?? '',
    roadAddress: child.roadAddress ?? '',
  },
  schoolQuery: child.schoolName,
  grade: child.grade,
  calendarColor: child.colorCode,
  className: child.className ?? '',
});
