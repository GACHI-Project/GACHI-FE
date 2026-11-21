import { useIsFocused } from '@react-navigation/native';
import { useMutation, useQuery, type Query } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import {
  assertCurrentSession,
  getSessionSnapshot,
  isCurrentSession,
  subscribeSession,
} from '../utils/authSession';
import { invalidateResources, queryClient, resourceKey } from './client';
import { serverOptions } from './options';

export const useSessionScope = () => {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, getSessionSnapshot);
  const { i18n } = useTranslation();
  return { ...session, language: i18n.language || 'ko' };
};

export const useServerQuery = <T>(
  domain: string,
  params: unknown[],
  fetch: (signal: AbortSignal) => Promise<T>,
  options: {
    enabled?: boolean;
    public?: boolean;
    staleTime?: number;
    gcTime?: number;
    retry?: boolean;
    refetchInterval?:
      | number
      | false
      | ((query: Query<T, Error, T, ReturnType<typeof resourceKey>>) => number | false);
  } = {}
) => {
  const scope = useSessionScope();
  const focused = useIsFocused();
  const queryKey = resourceKey(scope.version, scope.language, domain, ...params);
  const keyHash = JSON.stringify(queryKey);
  const query = useQuery(
    {
      ...serverOptions(scope, domain, params, fetch),
      enabled: (options.public || scope.authenticated) && options.enabled !== false,
      subscribed: focused,
      staleTime: options.staleTime ?? 30_000,
      gcTime: options.gcTime ?? 5 * 60_000,
      refetchInterval: options.refetchInterval,
      ...(options.retry === undefined ? {} : { retry: options.retry }),
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
      if (options.enabled !== false && (options.public || scope.authenticated)) {
        void queryClient.invalidateQueries({ queryKey: JSON.parse(keyHash), exact: true });
      }
    }, [keyHash, scope.authenticated, options.enabled, options.public])
  );
  return query;
};

export const useApiMutation = <TArgs extends unknown[], T>(
  fn: (...args: TArgs) => Promise<T>,
  domains: string[] = []
) => {
  const scope = useSessionScope();
  const pending = useRef(new Map<string, Promise<T>>());
  const mutation = useMutation(
    {
      mutationKey: ['session', scope.version, 'write', fn.name],
      mutationFn: async (args: TArgs) => {
        assertCurrentSession(scope.version);
        const result = await fn(...args);
        assertCurrentSession(scope.version);
        return result;
      },
      onSettled: () => {
        if (isCurrentSession(scope.version) && domains.length) {
          return invalidateResources(domains, scope.version);
        }
        return undefined;
      },
    },
    queryClient
  );
  const { mutateAsync } = mutation;
  return useCallback(
    (...args: TArgs) => {
      try {
        assertCurrentSession(scope.version);
      } catch (error) {
        return Promise.reject(error);
      }
      const key = JSON.stringify([scope.version, args]);
      const existing = pending.current.get(key);
      if (existing) return existing;
      const request = mutateAsync(args).finally(() => {
        pending.current.delete(key);
        assertCurrentSession(scope.version);
      });
      pending.current.set(key, request);
      return request;
    },
    [mutateAsync, scope.version]
  );
};

export const useDebouncedValue = <T>(value: T, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};
