import { CanceledError } from 'axios';
import { fetchUnreadCount } from '../api/notifications';
import i18n from '../i18n';
import { queryClient, resourceKey } from '../query/client';
import {
  assertCurrentSession,
  getSessionVersion,
  isCurrentSession,
  subscribeSession,
} from './authSession';

const pendingReads = new Map<number | 'all', Promise<void>>();
let readVersion = 0;
let readsSettled = Promise.resolve();
let resolveReadsSettled = () => {};
let currentSession = getSessionVersion();
subscribeSession(() => {
  if (getSessionVersion() === currentSession) return;
  currentSession = getSessionVersion();
  pendingReads.clear();
  resolveReadsSettled();
  readsSettled = Promise.resolve();
  readVersion += 1;
});

export const getNotificationReadVersion = () => readVersion;

// Pages wait for in-flight writes before deciding whether their read flags are still current.
export const waitForNotificationReads = async (): Promise<void> => {
  while (pendingReads.size > 0) {
    // eslint-disable-next-line no-await-in-loop -- a new write can start while awaiting the last batch.
    await readsSettled;
  }
};

// Every count consumer shares this guard so an older response cannot overwrite a newer one.
export const refreshUnreadCount = async (): Promise<void> => {
  const sessionVersion = getSessionVersion();
  if (pendingReads.size > 0) return;
  const queryKey = resourceKey(sessionVersion, i18n.language || 'ko', 'unread');
  await queryClient.cancelQueries({ queryKey, exact: true });
  assertCurrentSession(sessionVersion);

  await queryClient.fetchQuery({
    queryKey,
    staleTime: 0,
    queryFn: async ({ signal }) => {
      const count = await getUnreadTotal(signal);
      assertCurrentSession(sessionVersion);
      return count;
    },
  });
};

export const runNotificationRead = (
  key: number | 'all',
  read: () => Promise<number>
): Promise<void> => {
  const pending = pendingReads.get(key);
  if (pending) return pending;

  if (pendingReads.size === 0) {
    readsSettled = new Promise<void>((resolve) => {
      resolveReadsSettled = resolve;
    });
  }
  readVersion += 1;
  const sessionVersion = getSessionVersion();
  void queryClient.cancelQueries({
    predicate: (query) => query.queryKey[1] === sessionVersion && query.queryKey[3] === 'unread',
  });
  let operation: Promise<number>;
  try {
    operation = read();
  } catch (error) {
    operation = Promise.reject(error);
  }
  const request = operation
    .then((readCount) => {
      // readCount is the number changed by this write, not the remaining unread total.
      if (isCurrentSession(sessionVersion)) {
        queryClient.setQueriesData<number>(
          {
            predicate: (query) =>
              query.queryKey[1] === sessionVersion && query.queryKey[3] === 'unread',
          },
          (count) => (count === undefined ? undefined : Math.max(0, count - Math.max(0, readCount)))
        );
      }
    })
    .finally(() => {
      if (!isCurrentSession(sessionVersion)) return;
      // A failed response does not prove the server did not commit the write.
      readVersion += 1;
      pendingReads.delete(key);
      if (pendingReads.size === 0) {
        resolveReadsSettled();
        // Keep the last confirmed total if this background reconciliation fails.
        void refreshUnreadCount().catch(() => {});
      }
    });
  pendingReads.set(key, request);
  return request;
};

export const getUnreadTotal = async (signal?: AbortSignal): Promise<number> => {
  await waitForNotificationReads();
  const revision = readVersion;
  const count = await fetchUnreadCount(signal);
  await waitForNotificationReads();
  if (signal?.aborted) throw new CanceledError('Count request cancelled');
  if (revision !== readVersion) return getUnreadTotal(signal);
  return count;
};
