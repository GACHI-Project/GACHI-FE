/* eslint-env node */
const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const { queryRuntime } = require('./helpers/queryRuntime.cjs');

const runtimes = new Set();
afterEach(() => {
  runtimes.forEach((runtime) => runtime.dispose());
  runtimes.clear();
});
const item = (id, read = false) => ({ id, read, title: `Notification ${id}`, readAt: null });
const page = (items, nextCursor = null) => ({
  notifications: items,
  nextCursor,
  hasNext: nextCursor !== null,
});
const setup = async (items = [item(1), item(2)], count = 5, cursor = null) => {
  const r = queryRuntime();
  runtimes.add(r);
  const operations = r.load('src/query/notifications.ts');
  const counter = r.load('src/utils/unreadCount.ts');
  const { serverOptions } = r.load('src/query/options.ts');
  const list = r.observe(operations.notificationListOptions(r.scope()), true);
  const total = r.observe(
    serverOptions(r.scope(), 'unread', [], (signal) => counter.getUnreadTotal(signal))
  );
  await r.flush();
  r.calls.pages.calls[0].resolve(page(items, cursor));
  r.calls.count.calls[0].resolve(count);
  await r.flush();
  const flags = () =>
    list.result.data.pages.flatMap((group) => group.notifications.map((entry) => entry.read));
  const ids = () =>
    list.result.data.pages.flatMap((group) => group.notifications.map((entry) => entry.id));
  return { ...r, operations, counter, list, total, flags, ids };
};

test('the total uses the authoritative endpoint including unread rows on unloaded pages', async () => {
  const r = await setup([item(1)], 8, 20);
  assert.equal(r.total.result.data, 8);
  const more = r.list.result.fetchNextPage();
  await r.flush();
  r.calls.pages.calls[1].resolve(page([item(2, true)]));
  await more;
  assert.equal(r.total.result.data, 8);
  assert.deepEqual(r.ids(), [1, 2]);
});

test('a push refresh replaces an in-flight count instead of sharing its older total', async () => {
  const r = await setup();
  const beforePush = r.total.result.refetch();
  await r.flush();
  const oldCount = r.calls.count.calls.at(-1);
  const refresh = r.counter.refreshUnreadCount();
  await r.flush();
  assert.equal(oldCount.args[0].aborted, true);
  assert.equal(r.calls.count.calls.length, 3);
  oldCount.resolve(5);
  r.calls.count.calls.at(-1).resolve(6);
  await Promise.all([beforePush, refresh]);
  assert.equal(r.total.result.data, 6);
});

test('a successful read decrements only its server-confirmed delta and reconciles the total', async () => {
  const r = await setup();
  const pending = r.operations.readNotifications(1, [1, 2]);
  r.calls.read.calls[0].resolve(1);
  await pending;
  await r.flush();
  assert.equal(r.total.result.data, 4);
  assert.deepEqual(r.flags(), [true, false]);
  r.calls.count.calls.at(-1).resolve(4);
  r.calls.pages.calls.at(-1).resolve(page([item(1, true), item(2)]));
  await r.flush();
  assert.equal(r.total.result.data, 4);
});

test('a readCount of zero never decrements the badge twice', async () => {
  const r = await setup();
  const pending = r.operations.readNotifications(1, [1]);
  r.calls.read.calls[0].resolve(0);
  await pending;
  await r.flush();
  assert.equal(r.total.result.data, 5);
});

test('same-item reads from multiple consumers share one server write and one decrement', async () => {
  const r = await setup();
  const first = r.operations.readNotifications(1, [1, 2]);
  const second = r.operations.readNotifications(1, [1, 2]);
  assert.equal(r.calls.read.calls.length, 1);
  r.calls.read.calls[0].resolve(1);
  await Promise.all([first, second]);
  await r.flush();
  assert.equal(r.total.result.data, 4);
});

test('parallel successes update the cached total atomically and refresh after the last write', async () => {
  const r = await setup();
  const first = r.operations.readNotifications(1, [1, 2]);
  const second = r.operations.readNotifications(2, [1, 2]);
  r.calls.read.calls[1].resolve(1);
  await second;
  await r.flush();
  assert.equal(r.total.result.data, 4);
  assert.equal(r.calls.count.calls.length, 1);
  r.calls.read.calls[0].resolve(1);
  await first;
  await r.flush();
  assert.equal(r.total.result.data, 3);
  assert.equal(r.calls.count.calls.length, 2);
});

test('one failed read cannot roll back another successful read', async () => {
  const r = await setup();
  const first = r.operations.readNotifications(1, [1, 2]).catch(() => {});
  const second = r.operations.readNotifications(2, [1, 2]);
  r.calls.read.calls[1].resolve(1);
  await second;
  r.calls.read.calls[0].reject(new Error('Lost first response'));
  await first;
  await r.flush();
  assert.equal(r.total.result.data, 4);
  assert.deepEqual(r.flags(), [false, true]);
  r.calls.pages.calls.at(-1).resolve(page([item(1), item(2)]));
  r.calls.count.calls.at(-1).reject(new Error('Offline'));
  await r.flush();
  assert.deepEqual(r.flags(), [false, true]);
  assert.equal(r.total.result.data, 4);
});

test('read-all includes unloaded rows and accepts a nonzero reconciled count', async () => {
  const r = await setup([item(1), item(2)], 12);
  const pending = r.operations.readNotifications('all', [1, 2]);
  r.calls.readAll.calls[0].resolve(10);
  await pending;
  await r.flush();
  assert.equal(r.total.result.data, 2);
  assert.deepEqual(r.flags(), [true, true]);
  r.calls.count.calls.at(-1).resolve(2);
  r.calls.pages.calls.at(-1).resolve(page([item(1, true), item(2, true)]));
  await r.flush();
  assert.equal(r.total.result.data, 2);
});

test('concurrent read-all requests share one write without counting loaded rows', async () => {
  const r = await setup();
  const first = r.operations.readNotifications('all', [1, 2]);
  const second = r.operations.readNotifications('all', [1, 2]);
  assert.equal(r.calls.readAll.calls.length, 1);
  r.calls.readAll.calls[0].resolve(5);
  await Promise.all([first, second]);
  await r.flush();
  assert.equal(r.total.result.data, 0);
});

test('overlapping read-all and individual reads apply only server-confirmed deltas', async () => {
  const r = await setup();
  const first = r.operations.readNotifications('all', [1, 2]);
  const second = r.operations.readNotifications(1, [1, 2]);
  r.calls.read.calls[0].resolve(1);
  await second;
  r.calls.readAll.calls[0].resolve(4);
  await first;
  await r.flush();
  assert.equal(r.total.result.data, 0);
  assert.deepEqual(r.flags(), [true, true]);
});

test('a count request started before a write cannot overwrite the confirmed decrement', async () => {
  const r = await setup();
  const refresh = r.counter.refreshUnreadCount().catch(() => {});
  await r.flush();
  const oldCount = r.calls.count.calls[1];
  const read = r.operations.readNotifications(1, [1, 2]);
  r.calls.read.calls[0].resolve(1);
  await read;
  await r.flush();
  oldCount.resolve(99);
  await refresh;
  assert.equal(r.total.result.data, 4);
});

test('a page loading across a committed read is fetched again before applying flags', async () => {
  const r = await setup([item(1)], 5, 20);
  const more = r.list.result.fetchNextPage();
  await r.flush();
  const oldPage = r.calls.pages.calls[1];
  const read = r.operations.readNotifications(1, [1]);
  oldPage.resolve(page([item(2)]));
  r.calls.read.calls[0].resolve(1);
  await read;
  await r.flush();
  r.calls.pages.calls.at(-1).resolve(page([item(1, true)], 20));
  await r.flush();
  // An invalidation may cancel pagination; neither path can restore the confirmed unread flag.
  await more;
  assert.equal(r.flags()[0], true);
});

test('a lost read response resyncs authoritative flags without decrementing optimistically', async () => {
  const r = await setup();
  const pending = r.operations.readNotifications(1, [1, 2]).catch(() => {});
  r.calls.read.calls[0].reject(new Error('Lost response'));
  await pending;
  await r.flush();
  assert.equal(r.total.result.data, 5);
  r.calls.pages.calls.at(-1).resolve(page([item(1, true), item(2)]));
  r.calls.count.calls.at(-1).resolve(4);
  await r.flush();
  assert.equal(r.total.result.data, 4);
  assert.deepEqual(r.flags(), [true, false]);
});

test('failed pagination preserves the cursor for retry', async () => {
  const r = await setup([item(1)], 5, 20);
  const more = r.list.result.fetchNextPage();
  await r.flush();
  r.calls.pages.calls[1].reject(new Error('Offline'));
  await more;
  assert.deepEqual(r.ids(), [1]);
  const retry = r.list.result.fetchNextPage();
  await r.flush();
  assert.equal(r.calls.pages.calls[2].args[0].cursor, 20);
  r.calls.pages.calls[2].resolve(page([item(2)]));
  await retry;
  assert.deepEqual(r.ids(), [1, 2]);
});

['success', 'failure'].forEach((outcome) => {
  test(`an old account read ${outcome} cannot update the new account list or total`, async () => {
    const r = await setup();
    const pending = r.operations.readNotifications(1, [1, 2]).catch(() => {});
    r.session.invalidateSession();
    r.session.markSessionAuthenticated(r.session.getSessionVersion());
    r.client.setQueryData(r.key('unread'), 7);
    const key = r.key('notifications');
    r.client.setQueryData(key, { pages: [page([item(9)])], pageParams: [undefined] });
    if (outcome === 'success') r.calls.read.calls[0].resolve(1);
    else r.calls.read.calls[0].reject(new Error('Previous account failed'));
    await pending;
    await r.flush();
    assert.equal(r.client.getQueryData(r.key('unread')), 7);
    assert.equal(r.client.getQueryData(key).pages[0].notifications[0].id, 9);
  });
});

test('session invalidation clears cached totals and ignores late count responses', async () => {
  const r = await setup();
  const refresh = r.counter.refreshUnreadCount().catch(() => {});
  await r.flush();
  const old = r.calls.count.calls.at(-1);
  const key = r.key('unread');
  r.session.invalidateSession();
  old.resolve(99);
  await refresh;
  await r.flush();
  assert.equal(r.client.getQueryData(key), undefined);
});

test('a previous session read cannot block a new account count', async () => {
  const r = await setup();
  const pending = r.operations.readNotifications(1, [1]).catch(() => {});
  r.session.invalidateSession();
  r.session.markSessionAuthenticated(r.session.getSessionVersion());
  const fresh = r.counter.refreshUnreadCount();
  await r.flush();
  r.calls.count.calls.at(-1).resolve(8);
  await fresh;
  assert.equal(r.client.getQueryData(r.key('unread')), 8);
  r.calls.read.calls[0].resolve(1);
  await pending;
  assert.equal(r.client.getQueryData(r.key('unread')), 8);
});
