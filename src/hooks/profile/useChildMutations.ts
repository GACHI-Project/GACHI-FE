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
    try {
      const result = await fetchChildren();
      setChildren(result);
    } catch {
      // mutation 성공 후 목록 새로고침 실패 — 다음 포커스 시 재조회됨
    }
  };

  const removeChild = async (id: string) => {
    await deleteChild(Number(id));
    try {
      const result = await fetchChildren();
      setChildren(result);
    } catch {
      // mutation 성공 후 목록 새로고침 실패 — 다음 포커스 시 재조회됨
    }
  };

  return { saveChild, removeChild };
};

export default useChildMutations;
