import { fetchChildren, registerChild, updateChild, deleteChild } from '../../api/child';
import type { ChildInfo } from '../../types/child';
import { useChildrenStore } from '../../store/childrenStore';

const useChildMutations = () => {
  const { setChildren } = useChildrenStore();

  const saveChild = async (updated: ChildInfo, isNew: boolean) => {
    const payload = {
      name: updated.name,
      schoolName: updated.selectedSchool?.schoolName ?? updated.schoolQuery,
      schoolCode: updated.selectedSchool?.schoolCode ?? '',
      officeCode: updated.selectedSchool?.officeCode ?? '',
      grade: updated.grade ?? 1,
      colorCode: updated.calendarColor ?? '#2BAEE0',
      className: updated.className ?? '',
    };
    if (isNew) {
      await registerChild(payload);
    } else {
      await updateChild(Number(updated.id), payload);
    }
    const result = await fetchChildren();
    setChildren(result);
  };

  const removeChild = async (id: string) => {
    await deleteChild(Number(id));
    const result = await fetchChildren();
    setChildren(result);
  };

  return { saveChild, removeChild };
};

export default useChildMutations;
