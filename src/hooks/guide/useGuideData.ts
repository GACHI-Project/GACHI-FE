import { getPopularFaqs, getSchoolGuideCategories } from '../../api/schoolGuide';
import { useServerQuery } from '../../query/hooks';

const useGuideData = () => {
  const categories = useServerQuery('guide', ['categories'], (signal) =>
    getSchoolGuideCategories(signal)
  );
  const popular = useServerQuery('guide', ['popular'], (signal) => getPopularFaqs(signal));
  return {
    categories: categories.data ?? [],
    popularFaqs: popular.data ?? [],
    loading: categories.isLoading || popular.isLoading,
    loadError: categories.isError || popular.isError,
  };
};
export default useGuideData;
