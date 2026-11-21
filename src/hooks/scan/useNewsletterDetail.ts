import { getNewsletterDetail } from '../../api/newsletter';
import { useServerQuery } from '../../query/hooks';

const useNewsletterDetail = (id: number | undefined) => {
  const query = useServerQuery('newsletter', [id], (signal) => getNewsletterDetail(id!, signal), {
    enabled: !!id,
  });
  return { detail: query.data ?? null, loading: query.isLoading, error: query.error };
};
export default useNewsletterDetail;
