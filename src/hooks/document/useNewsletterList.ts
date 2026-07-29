import { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchNewsletters, type NewsletterItem } from '../../api/newsletter';

const useNewsletterList = (selectedChildName: string | undefined, searchQuery: string) => {
  const [newsletters, setNewsletters] = useState<NewsletterItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const selectedChildNameRef = useRef(selectedChildName);
  const searchQueryRef = useRef(searchQuery);

  useEffect(() => {
    selectedChildNameRef.current = selectedChildName;
  }, [selectedChildName]);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  const loadNewsletters = async (childName?: string, search?: string) => {
    setIsLoading(true);
    setPage(0);
    try {
      const result = await fetchNewsletters({ childName, search, page: 0 });
      setNewsletters(result.newsletters);
      setTotalCount(result.totalCount);
    } catch {
      // 목록 조회 실패 시 목록 유지
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    if (isLoadingMoreRef.current || isLoading || newsletters.length >= totalCount) return;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const result = await fetchNewsletters({
        childName: selectedChildNameRef.current,
        search: searchQueryRef.current.trim() || undefined,
        page: nextPage,
      });
      setNewsletters((prev) => [...prev, ...result.newsletters]);
      setPage(nextPage);
    } catch {
      // 추가 목록 조회 실패
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      loadNewsletters(selectedChildName, searchQuery.trim() || undefined);
    }, 500);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, selectedChildName]); // eslint-disable-line react-hooks/exhaustive-deps

  useFocusEffect(
    useCallback(() => {
      if (!isMountedRef.current) {
        isMountedRef.current = true;
        return;
      }
      loadNewsletters(selectedChildNameRef.current, searchQueryRef.current.trim() || undefined);
    }, []) // eslint-disable-line react-hooks/exhaustive-deps
  );

  return { newsletters, totalCount, isLoading, isLoadingMore, loadMore };
};

export default useNewsletterList;
