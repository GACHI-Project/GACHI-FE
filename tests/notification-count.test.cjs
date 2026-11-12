/* eslint-env node */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');
const { create } = require('zustand');
const { hookHarness, queuedApi } = require('./helpers/hookHarness.cjs');

const loadModule = (file, imports) => {
  const filename = path.resolve(__dirname, '..', file);
  const exports = {};
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => {
      if (!(name in imports)) throw new Error(`Unexpected module: ${name}`);
      return imports[name];
    },
  });
  return exports;
};

const item = (id, read = false) => ({
  id,
  read,
  type: 'SYSTEM',
  title: `Notification ${id}`,
  body: '',
  payload: {},
  readAt: null,
  createdAt: '2026-11-12T00:00:00Z',
});
const page = (notifications, nextCursor = null) => ({
  notifications,
  nextCursor,
  hasNext: nextCursor !== null,
});
const setup = () => {
  const counts = queuedApi();
  const pages = queuedApi();
  const children = queuedApi();
  const reads = queuedApi();
  const allReads = queuedApi();
  const { useNotificationStore: store } = loadModule('src/store/notificationStore.ts', {
    zustand: { create },
  });
  const counter = loadModule('src/utils/unreadCount.ts', {
    '../api/notifications': { fetchUnreadCount: counts.request },
    '../store/notificationStore': { useNotificationStore: store },
  });
  const makeHook = () =>
    hookHarness('src/hooks/notifications/useNotificationList.ts', {
      '../../api/notifications': {
        fetchNotifications: pages.request,
        markNotificationRead: reads.request,
        markAllNotificationsRead: allReads.request,
      },
      '../../api/calendar': { fetchChildren: children.request },
      '../../utils/unreadCount': counter,
    });
  const hook = makeHook();
  const start = async (notifications = [item(1), item(2)], count = 5, cursor = null) => {
    hook.render();
    pages.calls[0].resolve(page(notifications, cursor));
    children.calls[0].resolve([]);
    counts.calls[0].resolve(count);
    await hook.flush();
  };
  return { hook, counts, pages, children, reads, allReads, store, counter, start, makeHook };
};
const total = (s) => s.store.getState().unreadCount;
const flags = (s) => Array.from(s.hook.result.notifications, (notification) => notification.read);
const ids = (s) => Array.from(s.hook.result.notifications, (notification) => notification.id);

test('first page of 20 read notifications retains five unread notifications on older pages', async () => {
  const s = setup();
  await s.start(Array.from({ length: 20 }, (_, i) => item(i, true)));
  assert.equal(total(s), 5);
  assert.equal(s.hook.result.loadError, false);
});

test('failed total refresh leaves cached total and does not fail the list', async () => {
  const s = setup();
  s.store.getState().setUnreadCount(5);
  s.hook.render();
  s.pages.calls[0].resolve(page([item(1, true)]));
  s.children.calls[0].resolve([]);
  s.counts.calls[0].reject(new Error('offline'));
  await s.hook.flush();
  assert.equal(total(s), 5);
  assert.equal(s.hook.result.loadError, false);
  assert.equal(s.hook.result.isLoading, false);
});

test('additional pages never replace the global total with their unread count', async () => {
  const s = setup();
  await s.start([item(1, true)], 5, 1);
  const request = s.hook.result.loadMore();
  s.pages.calls[1].resolve(page([item(2), item(3)]));
  await request;
  await s.hook.flush();
  assert.deepEqual(ids(s), [1, 2, 3]);
  assert.equal(total(s), 5);
});

test('single read updates only after success and reconciles using the total endpoint', async () => {
  const s = setup();
  await s.start();
  const request = s.hook.result.markAsRead(1);
  assert.equal(total(s), 5);
  assert.deepEqual(flags(s), [false, false]);
  s.reads.calls[0].resolve(1);
  await request;
  await s.hook.flush();
  assert.equal(total(s), 4);
  assert.deepEqual(flags(s), [true, false]);
  s.counts.calls[1].resolve(6);
  await s.hook.flush();
  assert.equal(total(s), 6);
});

test('failed single read and failed reconciliation preserve the prior row and total', async () => {
  const s = setup();
  await s.start();
  const request = s.hook.result.markAsRead(1);
  s.reads.calls[0].reject(new Error('write failed'));
  await request;
  s.counts.calls[1].reject(new Error('offline'));
  await s.hook.flush();
  assert.equal(total(s), 5);
  assert.deepEqual(flags(s), [false, false]);
});

test('same-item duplicate requests are blocked and an already-read response does not decrement', async () => {
  const s = setup();
  await s.start();
  const request = s.hook.result.markAsRead(1);
  const duplicate = s.hook.result.markAsRead(1);
  assert.equal(s.reads.calls.length, 1);
  s.reads.calls[0].resolve(0);
  await Promise.all([request, duplicate]);
  await s.hook.flush();
  await s.hook.result.markAsRead(1);
  assert.equal(s.reads.calls.length, 1);
  assert.equal(total(s), 5);
  assert.deepEqual(flags(s), [true, false]);
});

test('one failed read cannot roll back another successful read', async () => {
  const s = setup();
  await s.start();
  const first = s.hook.result.markAsRead(1);
  const second = s.hook.result.markAsRead(2);
  s.reads.calls[1].resolve(1);
  await second;
  assert.equal(s.counts.calls.length, 1);
  s.reads.calls[0].reject(new Error('failed'));
  await first;
  s.counts.calls[1].reject(new Error('offline'));
  await s.hook.flush();
  assert.equal(total(s), 4);
  assert.deepEqual(flags(s), [false, true]);
});

test('parallel successes decrement atomically and fetch a total after both finish', async () => {
  const s = setup();
  await s.start();
  const first = s.hook.result.markAsRead(1);
  const second = s.hook.result.markAsRead(2);
  s.reads.calls[1].resolve(1);
  await second;
  s.reads.calls[0].resolve(1);
  await first;
  await s.hook.flush();
  assert.equal(total(s), 3);
  assert.deepEqual(flags(s), [true, true]);
  assert.equal(s.counts.calls.length, 2);
});

test('read-all includes unloaded rows and accepts a nonzero reconciled count', async () => {
  const s = setup();
  await s.start();
  const request = s.hook.result.handleMarkAllRead();
  s.allReads.calls[0].resolve(5);
  await request;
  await s.hook.flush();
  assert.equal(total(s), 0);
  assert.deepEqual(flags(s), [true, true]);
  s.counts.calls[1].resolve(1);
  await s.hook.flush();
  assert.equal(total(s), 1);
});

test('failed read-all preserves successful individual reads and subsequently loaded pages', async () => {
  const s = setup();
  await s.start([item(1), item(2)], 5, 2);
  const all = s.hook.result.handleMarkAllRead();
  const single = s.hook.result.markAsRead(1);
  s.reads.calls[0].resolve(1);
  await single;
  const more = s.hook.result.loadMore();
  s.pages.calls[1].resolve(page([item(3)]));
  s.allReads.calls[0].reject(new Error('failed'));
  await all;
  await s.hook.flush();
  s.pages.calls[2].resolve(page([item(3)]));
  await more;
  await s.hook.flush();
  assert.equal(total(s), 4);
  assert.deepEqual(ids(s), [1, 2, 3]);
  assert.deepEqual(flags(s), [true, false, false]);
});

test('read-all success followed by individual failure cannot restore unread flags', async () => {
  const s = setup();
  await s.start();
  const single = s.hook.result.markAsRead(1);
  const all = s.hook.result.handleMarkAllRead();
  const duplicate = s.hook.result.handleMarkAllRead();
  assert.equal(s.allReads.calls.length, 1);
  s.allReads.calls[0].resolve(5);
  await Promise.all([all, duplicate]);
  s.reads.calls[0].reject(new Error('failed'));
  await single;
  await s.hook.flush();
  assert.equal(total(s), 0);
  assert.deepEqual(flags(s), [true, true]);
});

test('overlapping successful read-all and single read apply only server-confirmed deltas', async () => {
  const s = setup();
  await s.start();
  const single = s.hook.result.markAsRead(1);
  const all = s.hook.result.handleMarkAllRead();
  s.reads.calls[0].resolve(1);
  await single;
  s.allReads.calls[0].resolve(4);
  await all;
  assert.equal(total(s), 0);
});

test('page loaded during read-all waits and refetches authoritative flags, including new arrivals', async () => {
  const s = setup();
  await s.start();
  const all = s.hook.result.handleMarkAllRead();
  s.hook.result.loadInitial();
  s.pages.calls[1].resolve(page([item(3), item(1)]));
  s.children.calls[1].resolve([]);
  await s.hook.flush();
  assert.deepEqual(ids(s), [1, 2]);
  s.allReads.calls[0].resolve(5);
  await all;
  await s.hook.flush();
  assert.equal(s.pages.calls.length, 3);
  s.pages.calls[2].resolve(page([item(3), item(1, true)]));
  await s.hook.flush();
  assert.deepEqual(ids(s), [3, 1]);
  assert.deepEqual(flags(s), [false, true]);
});

test('count request started before a read cannot overwrite its confirmed decrement', async () => {
  const s = setup();
  await s.start();
  const refresh = s.counter.refreshUnreadCount();
  const read = s.hook.result.markAsRead(1);
  s.reads.calls[0].resolve(1);
  await read;
  s.counts.calls[1].resolve(5);
  await refresh;
  s.counts.calls[2].reject(new Error('offline'));
  await s.hook.flush();
  assert.equal(total(s), 4);
});

test('out-of-order home and push refreshes only apply the newest response', async () => {
  const s = setup();
  const first = s.counter.refreshUnreadCount();
  const second = s.counter.refreshUnreadCount();
  s.counts.calls[1].resolve(3);
  await second;
  s.counts.calls[0].resolve(8);
  await first;
  assert.equal(total(s), 3);
});

test('failed home refresh keeps the cached total and invalidates older responses', async () => {
  const s = setup();
  s.store.getState().setUnreadCount(5);
  const first = s.counter.refreshUnreadCount();
  const second = s.counter.refreshUnreadCount();
  s.counts.calls[1].reject(new Error('offline'));
  await assert.rejects(second);
  s.counts.calls[0].resolve(0);
  await first;
  assert.equal(total(s), 5);
});

test('refresh during a read waits until the final write has settled', async () => {
  const s = setup();
  await s.start();
  const read = s.hook.result.markAsRead(1);
  await s.counter.refreshUnreadCount();
  assert.equal(s.counts.calls.length, 1);
  s.reads.calls[0].resolve(1);
  await read;
  assert.equal(s.counts.calls.length, 2);
});

test('initial page returned before a committed read is retried before replacing rows', async () => {
  const s = setup();
  await s.start();
  s.hook.result.loadInitial();
  const read = s.hook.result.markAsRead(1);
  s.reads.calls[0].resolve(1);
  await read;
  s.pages.calls[1].resolve(page([item(1), item(2)]));
  s.children.calls[1].resolve([]);
  await s.hook.flush();
  assert.equal(s.pages.calls.length, 3);
  assert.deepEqual(flags(s), [true, false]);
  s.pages.calls[2].resolve(page([item(1, true), item(2)]));
  await s.hook.flush();
  assert.deepEqual(flags(s), [true, false]);
  assert.equal(s.hook.result.isLoading, false);
});

test('pagination returned before read-all committed is retried to avoid stale unread rows', async () => {
  const s = setup();
  await s.start([item(1)], 5, 1);
  const more = s.hook.result.loadMore();
  const all = s.hook.result.handleMarkAllRead();
  s.allReads.calls[0].resolve(5);
  await all;
  s.pages.calls[1].resolve(page([item(2)]));
  await s.hook.flush();
  assert.equal(s.pages.calls.length, 3);
  s.pages.calls[2].resolve(page([item(2, true)]));
  await more;
  await s.hook.flush();
  assert.deepEqual(flags(s), [true, true]);
});

test('duplicate pagination is blocked and failures preserve the retry cursor', async () => {
  const s = setup();
  await s.start([item(1)], 5, 1);
  const first = s.hook.result.loadMore();
  await s.hook.result.loadMore();
  assert.equal(s.pages.calls.length, 2);
  s.pages.calls[1].reject(new Error('offline'));
  await first;
  const retry = s.hook.result.loadMore();
  assert.equal(s.pages.calls[2].args[0].cursor, 1);
  s.pages.calls[2].resolve(page([item(1), item(2)]));
  await retry;
  await s.hook.flush();
  assert.deepEqual(ids(s), [1, 2]);
});

test('old pagination cannot append after a reload or clear a newer loading indicator', async () => {
  const s = setup();
  await s.start([item(1)], 5, 1);
  const old = s.hook.result.loadMore();
  s.hook.result.loadInitial();
  s.pages.calls[2].resolve(page([item(3)], 3));
  s.children.calls[1].resolve([]);
  await s.hook.flush();
  const current = s.hook.result.loadMore();
  s.pages.calls[1].resolve(page([item(2)]));
  await old;
  await s.hook.flush();
  assert.deepEqual(ids(s), [3]);
  assert.equal(s.hook.result.isFetchingMore, true);
  s.pages.calls[3].resolve(page([item(4)]));
  await current;
  await s.hook.flush();
  assert.deepEqual(ids(s), [3, 4]);
});

test('blur invalidates page responses and refocus starts a fresh query', async () => {
  const s = setup();
  s.hook.render();
  s.hook.blur();
  s.pages.calls[0].resolve(page([item(1)]));
  s.children.calls[0].resolve([]);
  await s.hook.flush();
  assert.deepEqual(ids(s), []);
  s.hook.focus();
  s.pages.calls[1].resolve(page([item(2)]));
  s.children.calls[1].resolve([]);
  await s.hook.flush();
  assert.deepEqual(ids(s), [2]);
});

test('read completing after navigation updates the global total without updating an unmounted hook', async () => {
  const s = setup();
  await s.start();
  const read = s.hook.result.markAsRead(1);
  s.hook.unmount();
  s.reads.calls[0].resolve(1);
  await read;
  await s.hook.flush();
  assert.equal(total(s), 4);
  assert.equal(s.hook.postUnmountUpdates, 0);
});

test('a remounted list waits for a read started by the previous screen instance', async () => {
  const s = setup();
  await s.start();
  const read = s.hook.result.markAsRead(1);
  s.hook.unmount();
  const next = s.makeHook();
  next.render();
  s.pages.calls[1].resolve(page([item(1)]));
  s.children.calls[1].resolve([]);
  await next.flush();
  assert.equal(next.result.notifications.length, 0);
  s.reads.calls[0].resolve(1);
  await read;
  await next.flush();
  assert.equal(s.pages.calls.length, 3);
  s.pages.calls[2].resolve(page([item(1, true)]));
  await next.flush();
  assert.equal(next.result.notifications[0].read, true);
  assert.equal(total(s), 4);
});

test('a page waiting on a failed read refetches without discarding other rows', async () => {
  const s = setup();
  await s.start([item(1)], 5, 1);
  const read = s.hook.result.markAsRead(1);
  const more = s.hook.result.loadMore();
  s.pages.calls[1].resolve(page([item(2)]));
  await s.hook.flush();
  assert.deepEqual(ids(s), [1]);
  s.reads.calls[0].reject(new Error('failed'));
  await read;
  await s.hook.flush();
  assert.equal(s.pages.calls.length, 3);
  s.pages.calls[2].resolve(page([item(2)]));
  await more;
  await s.hook.flush();
  assert.deepEqual(ids(s), [1, 2]);
  assert.deepEqual(flags(s), [false, false]);
  assert.equal(total(s), 5);
});

test('single reads from a remounted screen share the pending request and decrement only once', async () => {
  const s = setup();
  await s.start();
  const next = s.makeHook();
  next.render();
  s.pages.calls[1].resolve(page([item(1)]));
  s.children.calls[1].resolve([]);
  s.counts.calls[1].resolve(5);
  await next.flush();
  const first = s.hook.result.markAsRead(1);
  s.hook.unmount();
  const second = next.result.markAsRead(1);
  assert.equal(s.reads.calls.length, 1);
  s.reads.calls[0].resolve(1);
  await Promise.all([first, second]);
  await next.flush();
  assert.equal(total(s), 4);
  assert.equal(next.result.notifications[0].read, true);
  assert.equal(s.counts.calls.length, 3);
});

test('read-all requests from different screen instances share one server write', async () => {
  const s = setup();
  await s.start();
  const next = s.makeHook();
  next.render();
  s.pages.calls[1].resolve(page([item(1)]));
  s.children.calls[1].resolve([]);
  s.counts.calls[1].resolve(5);
  await next.flush();
  const first = s.hook.result.handleMarkAllRead();
  const second = next.result.handleMarkAllRead();
  assert.equal(s.allReads.calls.length, 1);
  s.allReads.calls[0].resolve(5);
  await Promise.all([first, second]);
  await s.hook.flush();
  await next.flush();
  assert.equal(total(s), 0);
  assert.equal(next.result.notifications[0].read, true);
  assert.deepEqual(flags(s), [true, true]);
});

test('an unread page loaded during a write is retried even when the write response is lost', async () => {
  const s = setup();
  await s.start();
  const read = s.hook.result.markAsRead(1);
  s.hook.result.loadInitial();
  s.pages.calls[1].resolve(page([item(1), item(2)]));
  s.children.calls[1].resolve([]);
  await s.hook.flush();
  s.reads.calls[0].reject(new Error('response lost after commit'));
  await read;
  await s.hook.flush();
  assert.equal(s.pages.calls.length, 3);
  s.pages.calls[2].resolve(page([item(1, true), item(2)]));
  s.counts.calls[1].resolve(4);
  await s.hook.flush();
  assert.deepEqual(flags(s), [true, false]);
  assert.equal(total(s), 4);
});

test('a synchronous failure releases the shared lock and allows retrying the same key', async () => {
  const s = setup();
  s.store.getState().setUnreadCount(5);
  await assert.rejects(
    s.counter.runNotificationRead(1, () => {
      throw new Error('synchronous failure');
    })
  );
  const retry = s.counter.runNotificationRead(1, s.reads.request);
  assert.equal(s.reads.calls.length, 1);
  s.reads.calls[0].resolve(1);
  await retry;
  assert.equal(total(s), 4);
});
