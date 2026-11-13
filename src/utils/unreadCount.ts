import { fetchUnreadCount } from '../api/notifications';
import { useNotificationStore } from '../store/notificationStore';

let requestVersion = 0;
const pendingReads = new Map<number | 'all', Promise<void>>();
let readVersion = 0;
let readsSettled = Promise.resolve();
let resolveReadsSettled = () => {};

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
  requestVersion += 1;
  const version = requestVersion;
  if (pendingReads.size > 0) return;

  const count = await fetchUnreadCount();
  if (version === requestVersion && pendingReads.size === 0) {
    useNotificationStore.getState().setUnreadCount(count);
  }
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
  requestVersion += 1;
  let operation: Promise<number>;
  try {
    operation = read();
  } catch (error) {
    operation = Promise.reject(error);
  }
  const request = operation
    .then((readCount) => {
      // readCount is the number changed by this write, not the remaining unread total.
      useNotificationStore.getState().decreaseUnreadCount(readCount);
    })
    .finally(() => {
      // A failed response does not prove the server did not commit the write.
      readVersion += 1;
      pendingReads.delete(key);
      requestVersion += 1;
      if (pendingReads.size === 0) {
        resolveReadsSettled();
        // Keep the last confirmed total if this background reconciliation fails.
        void refreshUnreadCount().catch(() => {});
      }
    });
  pendingReads.set(key, request);
  return request;
};
