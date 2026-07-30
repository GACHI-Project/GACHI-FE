import { useState, useEffect } from 'react';
import {
  getSchoolGuideCategories,
  getPopularFaqs,
  type SchoolGuideCategory,
  type PopularFaq,
} from '../../api/schoolGuide';

const useGuideData = () => {
  const [categories, setCategories] = useState<SchoolGuideCategory[]>([]);
  const [popularFaqs, setPopularFaqs] = useState<PopularFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    Promise.all([getSchoolGuideCategories(), getPopularFaqs()])
      .then(([cats, faqs]) => {
        setCategories(cats);
        setPopularFaqs(faqs);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  return { categories, popularFaqs, loading, loadError };
};

export default useGuideData;
