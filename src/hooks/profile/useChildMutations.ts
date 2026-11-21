import { deleteChild, registerChild, updateChild } from '../../api/child';
import { useApiMutation } from '../../query/hooks';
import type { ChildInfo } from '../../types/child';

const domains = [
  'children',
  'calendar',
  'markers',
  'schoolSchedules',
  'meals',
  'timetables',
  'newsletters',
  'newsletter',
  'recent',
  'today',
];
const useChildMutations = () => {
  const saveChild = useApiMutation(async (updated: ChildInfo, isNew: boolean) => {
    const payload = {
      name: updated.name,
      schoolName: updated.selectedSchool?.schoolName ?? updated.schoolQuery,
      schoolCode: updated.selectedSchool?.schoolCode ?? '',
      officeCode: updated.selectedSchool?.officeCode ?? '',
      grade: updated.grade ?? 1,
      colorCode: updated.calendarColor ?? '#2BAEE0',
      className: updated.className ?? '',
    };
    if (isNew) await registerChild(payload);
    else await updateChild(Number(updated.id), payload);
  }, domains);
  const removeChild = useApiMutation((id: string) => deleteChild(Number(id)), domains);
  return { saveChild, removeChild };
};
export default useChildMutations;
