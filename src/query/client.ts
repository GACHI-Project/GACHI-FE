import { QueryClient } from '@tanstack/react-query';
import { getSessionVersion, subscribeSession } from '../utils/authSession';
import { isTransientQueryError } from './state';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (count, error) => count < 2 && isTransientQueryError(error),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    // Do not queue writes to replay after connectivity or accounts change.
    mutations: { retry: false, networkMode: 'always' },
  },
});

export const resourceKey = (
  version: number,
  language: string,
  domain: string,
  ...params: unknown[]
) => ['session', version, language, domain, ...params] as const;

export const invalidateResources = (domains: string[], version = getSessionVersion()) =>
  queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey[1] === version && domains.includes(String(query.queryKey[3])),
  });

let version = getSessionVersion();
subscribeSession(() => {
  const next = getSessionVersion();
  if (next === version) return;
  version = next;
  void queryClient.cancelQueries();
  queryClient.clear();
});
