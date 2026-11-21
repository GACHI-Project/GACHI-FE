import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { fetchNewsletters } from '../api/newsletter';
import { assertCurrentSession } from '../utils/authSession';
import { applyResourceChanges, getChangeSequence } from './checklists';
import { resourceKey } from './client';

export interface QueryScope {
  version: number;
  language: string;
}

export const serverOptions = <T>(
  scope: QueryScope,
  domain: string,
  params: unknown[],
  fetch: (signal: AbortSignal) => Promise<T>
) =>
  queryOptions({
    queryKey: resourceKey(scope.version, scope.language, domain, ...params),
    queryFn: async ({ signal }) => {
      assertCurrentSession(scope.version);
      const started = getChangeSequence();
      const result = await fetch(signal);
      assertCurrentSession(scope.version);
      return ['calendar', 'newsletterChecklist', 'today'].includes(domain)
        ? applyResourceChanges(result, scope.version, started)
        : result;
    },
  });

export const newsletterListOptions = (
  scope: QueryScope,
  childName: string | undefined,
  search: string | undefined
) =>
  infiniteQueryOptions({
    queryKey: resourceKey(scope.version, scope.language, 'newsletters', childName, search),
    initialPageParam: 0,
    queryFn: async ({ pageParam, signal }) => {
      assertCurrentSession(scope.version);
      const result = await fetchNewsletters({ childName, search, page: pageParam }, signal);
      assertCurrentSession(scope.version);
      return result;
    },
    getNextPageParam: (last, pages, lastPage) =>
      pages.reduce((count, page) => count + page.newsletters.length, 0) < last.totalCount &&
      last.newsletters.length > 0
        ? lastPage + 1
        : undefined,
  });
