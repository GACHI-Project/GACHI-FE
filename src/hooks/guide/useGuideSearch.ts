import { useState, useRef, useEffect } from 'react';
import { getSchoolGuideFaqs, type SchoolGuideFaqItem } from '../../api/schoolGuide';

const useGuideSearch = (searchQuery: string) => {
  const [searchResults, setSearchResults] = useState<SchoolGuideFaqItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSearchReqId = useRef(0);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    lastSearchReqId.current += 1;
    const reqId = lastSearchReqId.current;

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return () => {};
    }

    setSearchLoading(true);
    debounceTimer.current = setTimeout(() => {
      getSchoolGuideFaqs({ search: searchQuery.trim() })
        .then((items) => {
          if (reqId !== lastSearchReqId.current) return;
          setSearchResults(items);
        })
        .catch(() => {
          if (reqId !== lastSearchReqId.current) return;
          setSearchResults([]);
        })
        .finally(() => {
          if (reqId === lastSearchReqId.current) setSearchLoading(false);
        });
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery]);

  return { searchResults, searchLoading };
};

export default useGuideSearch;
