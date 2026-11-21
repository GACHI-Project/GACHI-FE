import { useState } from 'react';
import { getSchoolGuideFaqDetail } from '../../api/schoolGuide';
import { useServerQuery } from '../../query/hooks';

const useGuideFaqExpand = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const query = useServerQuery(
    'guide',
    ['detail', expandedId],
    (signal) => getSchoolGuideFaqDetail(expandedId!, signal),
    { enabled: expandedId !== null }
  );
  return {
    expandedId,
    answerCache: query.data && expandedId !== null ? { [expandedId]: query.data.answer } : {},
    loadingDetailId: query.isLoading ? expandedId : null,
    handleExpand: (id: number) => setExpandedId((current) => (current === id ? null : id)),
    clearExpand: () => setExpandedId(null),
  };
};
export default useGuideFaqExpand;
