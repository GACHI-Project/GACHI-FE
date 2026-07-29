import { useEffect, useState } from 'react';
import { getNewsletterDetail, type NewsletterDetail } from '../../api/newsletter';

const useNewsletterDetail = (newsletterId: number | undefined) => {
  const [detail, setDetail] = useState<NewsletterDetail | null>(null);
  const [loading, setLoading] = useState(!!newsletterId);

  useEffect(() => {
    if (!newsletterId) {
      setDetail(null);
      setLoading(false);
      return () => {};
    }
    let cancelled = false;
    setDetail(null);
    setLoading(true);
    getNewsletterDetail(newsletterId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [newsletterId]);

  return { detail, loading };
};

export default useNewsletterDetail;
