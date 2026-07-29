import { useState } from 'react';
import { getSchoolGuideFaqDetail } from '../../api/schoolGuide';

const useGuideFaqExpand = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [answerCache, setAnswerCache] = useState<Record<number, string>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);

  const handleExpand = (faqId: number) => {
    if (expandedId === faqId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(faqId);
    if (answerCache[faqId] !== undefined) return;

    setLoadingDetailId(faqId);
    getSchoolGuideFaqDetail(faqId)
      .then((detail) => setAnswerCache((prev) => ({ ...prev, [faqId]: detail.answer })))
      .catch(() => {})
      .finally(() => setLoadingDetailId((current) => (current === faqId ? null : current)));
  };

  const clearExpand = () => setExpandedId(null);

  return { expandedId, answerCache, loadingDetailId, handleExpand, clearExpand };
};

export default useGuideFaqExpand;
