import i18n from '../i18n';
import { assertCurrentSession, getSessionVersion, isCurrentSession } from '../utils/authSession';
import { invalidateResources, queryClient, resourceKey } from './client';

export const fetchSessionResource = <T>(
  domain: string,
  params: unknown[],
  fetch: (signal: AbortSignal) => Promise<T>
) => {
  const version = getSessionVersion();
  return queryClient.fetchQuery({
    queryKey: resourceKey(version, i18n.language || 'ko', domain, ...params),
    queryFn: async ({ signal }) => {
      assertCurrentSession(version);
      const result = await fetch(signal);
      assertCurrentSession(version);
      return result;
    },
  });
};

// Native callbacks and startup tasks execute outside a React component.
export const executeSessionMutation = <T>(write: () => Promise<T>, domains: string[] = []) => {
  const version = getSessionVersion();
  const cache = queryClient.getMutationCache();
  const mutation = cache.build(queryClient, {
    // This operation has no React observer; remove it explicitly after settlement.
    gcTime: Infinity,
    mutationFn: async () => {
      assertCurrentSession(version);
      const result = await write();
      assertCurrentSession(version);
      return result;
    },
    onSettled: () =>
      isCurrentSession(version) ? invalidateResources(domains, version) : undefined,
  });
  return mutation.execute(undefined).finally(() => {
    cache.remove(mutation);
    assertCurrentSession(version);
  });
};
