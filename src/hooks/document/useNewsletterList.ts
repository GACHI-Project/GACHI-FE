import { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchNewsletters, type NewsletterItem } from '../../api/newsletter';

interface ListRequest {
  childName: string | undefined;
  search: string | undefined;
  page: number;
  loadedCount: number;
  totalCount: number;
  loading: boolean;
  loadingMore: boolean;
}

const useNewsletterList = (selectedChildName: string | undefined, searchQuery: string) => {
  const [newsletters, setNewsletters] = useState<NewsletterItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const search = searchQuery.trim() || undefined;

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFocusedRef = useRef(false);
  const focusedRef = useRef(false);
  const queryRef = useRef({ childName: selectedChildName, search });
  const activeRequestRef = useRef<ListRequest | null>(null);
  const lastLoadedRef = useRef<ListRequest | null>(null);

  const loadNewsletters = useCallback(async () => {
    if (!focusedRef.current) return;
    const previous = lastLoadedRef.current;
    const request: ListRequest = {
      ...queryRef.current,
      page: previous?.page ?? 0,
      loadedCount: previous?.loadedCount ?? 0,
      totalCount: previous?.totalCount ?? 0,
      loading: true,
      loadingMore: false,
    };
    activeRequestRef.current = request;
    setIsLoading(true);
    setIsLoadingMore(false);
    try {
      const result = await fetchNewsletters({
        childName: request.childName,
        search: request.search,
        page: 0,
      });
      if (activeRequestRef.current !== request) return;
      request.page = 0;
      request.loadedCount = result.newsletters.length;
      request.totalCount = result.totalCount;
      lastLoadedRef.current = request;
      setNewsletters(result.newsletters);
      setTotalCount(result.totalCount);
    } catch {
      // Preserve the current list when reloading the same query fails.
    } finally {
      if (activeRequestRef.current === request) {
        request.loading = false;
        setIsLoading(false);
      }
    }
  }, []);

  const loadMore = useCallback(async () => {
    const request = activeRequestRef.current;
    if (
      !request ||
      request.loading ||
      request.loadingMore ||
      request.loadedCount >= request.totalCount
    )
      return;

    request.loadingMore = true;
    setIsLoadingMore(true);
    const nextPage = request.page + 1;
    try {
      const result = await fetchNewsletters({
        childName: request.childName,
        search: request.search,
        page: nextPage,
      });
      if (activeRequestRef.current !== request) return;
      request.page = nextPage;
      request.loadedCount += result.newsletters.length;
      request.totalCount = result.totalCount;
      lastLoadedRef.current = request;
      setNewsletters((prev) => [...prev, ...result.newsletters]);
      setTotalCount(result.totalCount);
    } catch {
      // A failed page can be retried without advancing pagination.
    } finally {
      if (activeRequestRef.current === request) {
        request.loadingMore = false;
        setIsLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    queryRef.current = { childName: selectedChildName, search };
    lastLoadedRef.current = null;
    // Invalidate the previous query before the debounce timer fires.
    activeRequestRef.current = null;
    setNewsletters([]);
    setTotalCount(0);
    setIsLoading(true);
    setIsLoadingMore(false);
    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null;
      void loadNewsletters();
    }, 500);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      activeRequestRef.current = null;
    };
  }, [selectedChildName, search, loadNewsletters]);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      if (hasFocusedRef.current) {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        void loadNewsletters();
      }
      hasFocusedRef.current = true;
      return () => {
        focusedRef.current = false;
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        activeRequestRef.current = null;
      };
    }, [loadNewsletters])
  );

  return { newsletters, totalCount, isLoading, isLoadingMore, loadMore };
};

export default useNewsletterList;
