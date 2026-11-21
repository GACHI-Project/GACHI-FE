import { getSchoolGuideFaqs } from '../../api/schoolGuide';
import { useDebouncedValue, useServerQuery } from '../../query/hooks';

const useGuideSearch = (value: string) => {
  const search = value.trim();
  const debounced = useDebouncedValue(search);
  const query = useServerQuery(
    'guide',
    ['search', search],
    (signal) => getSchoolGuideFaqs({ search }, signal),
    { enabled: !!search && search === debounced }
  );
  return {
    searchResults: query.data ?? [],
    searchLoading: !!search && (search !== debounced || query.isLoading),
  };
};
export default useGuideSearch;
