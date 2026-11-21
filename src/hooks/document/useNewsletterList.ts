import { useIsFocused } from '@react-navigation/native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { queryClient, resourceKey } from '../../query/client';
import { useDebouncedValue, useSessionScope } from '../../query/hooks';
import { newsletterListOptions } from '../../query/options';
import { hasBlockingQueryError } from '../../query/state';

const useNewsletterList = (selectedChildName: string | undefined, searchQuery: string) => {
  const scope = useSessionScope();
  const focused = useIsFocused();
  const search = searchQuery.trim() || undefined;
  const debounced = useDebouncedValue(search, 500);
  const queryKey = resourceKey(
    scope.version,
    scope.language,
    'newsletters',
    selectedChildName,
    search
  );
  const keyHash = JSON.stringify(queryKey);
  const enabled = scope.authenticated && search === debounced;
  const query = useInfiniteQuery(
    {
      ...newsletterListOptions(scope, selectedChildName, search),
      enabled,
      subscribed: focused,
    },
    queryClient
  );
  const firstFocus = useRef(true);
  const previousKey = useRef(keyHash);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current || previousKey.current !== keyHash) {
        firstFocus.current = false;
        previousKey.current = keyHash;
        return;
      }
      void queryClient.invalidateQueries({ queryKey: JSON.parse(keyHash), exact: true });
    }, [keyHash])
  );
  const loadMore = async () => {
    if (!focused || !enabled || query.isFetching || !query.hasNextPage) return;
    await query.fetchNextPage({ cancelRefetch: false });
  };
  return {
    newsletters: query.data?.pages.flatMap((page) => page.newsletters) ?? [],
    totalCount: query.data?.pages.at(-1)?.totalCount ?? 0,
    isLoading: search !== debounced || query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    error: query.error,
    loadError: hasBlockingQueryError(query),
    isWaiting: query.data === undefined && !query.error && query.fetchStatus === 'paused',
    retry: async () => {
      if (!focused || !enabled) return;
      if (query.isFetchNextPageError) await query.fetchNextPage({ cancelRefetch: false });
      else await query.refetch();
    },
    loadMore,
  };
};
export default useNewsletterList;
