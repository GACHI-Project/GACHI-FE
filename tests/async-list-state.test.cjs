/* eslint-env node */
const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const { queryRuntime } = require('./helpers/queryRuntime.cjs');
const { queuedApi } = require('./helpers/hookHarness.cjs');

const runtimes = new Set();
const setup = () => {
  const runtime = queryRuntime();
  runtimes.add(runtime);
  return runtime;
};
afterEach(() => {
  runtimes.forEach((runtime) => runtime.dispose());
  runtimes.clear();
});
const list = (ids, totalCount = 5) => ({
  newsletters: ids.map((newsletterId) => ({ newsletterId })),
  totalCount,
});
const listIds = (view) =>
  view.result.data?.pages.flatMap((page) => page.newsletters.map((item) => item.newsletterId)) ??
  [];

['child', 'search'].forEach((condition) => {
  test(`document ${condition} changes isolate a late page from the current cache`, async () => {
    const r = setup();
    const { newsletterListOptions } = r.load('src/query/options.ts');
    const first = newsletterListOptions(r.scope(), 'A', undefined);
    const view = r.observe(first, true);
    r.calls.newsletters.calls[0].resolve(list(['A0']));
    await r.flush();
    const pending = view.result.fetchNextPage();
    await r.flush();
    const next = newsletterListOptions(
      r.scope(),
      condition === 'child' ? 'B' : 'A',
      condition === 'search' ? 'new' : undefined
    );
    view.setOptions(next);
    r.calls.newsletters.calls[2].resolve(list(['B0']));
    await r.flush();
    r.calls.newsletters.calls[1].resolve(list(['A1']));
    await pending;
    await r.flush();
    assert.deepEqual(listIds(view), ['B0']);
    const more = view.result.fetchNextPage();
    await r.flush();
    assert.equal(r.calls.newsletters.calls[3].args[0].page, 1);
    r.calls.newsletters.calls[3].resolve(list(['B1']));
    await more;
    assert.deepEqual(listIds(view), ['B0', 'B1']);
  });
});

test('failed pagination preserves loaded pages and retries the same page', async () => {
  const r = setup();
  const { newsletterListOptions } = r.load('src/query/options.ts');
  const view = r.observe(newsletterListOptions(r.scope(), undefined, undefined), true);
  r.calls.newsletters.calls[0].resolve(list(['first']));
  await r.flush();
  const pending = view.result.fetchNextPage();
  await r.flush();
  r.calls.newsletters.calls[1].reject(new Error('Network failure'));
  await pending;
  assert.deepEqual(listIds(view), ['first']);
  const retry = view.result.fetchNextPage();
  await r.flush();
  assert.equal(r.calls.newsletters.calls[2].args[0].page, 1);
  r.calls.newsletters.calls[2].resolve(list(['second']));
  await retry;
  assert.deepEqual(listIds(view), ['first', 'second']);
});

test('the last page stops pagination and refresh restarts from the initial cursor', async () => {
  const r = setup();
  const { newsletterListOptions } = r.load('src/query/options.ts');
  const options = newsletterListOptions(r.scope(), undefined, undefined);
  const view = r.observe(options, true);
  r.calls.newsletters.calls[0].resolve(list(['only'], 1));
  await r.flush();
  assert.equal(view.result.hasNextPage, false);
  const refresh = view.result.refetch();
  await r.flush();
  assert.equal(r.calls.newsletters.calls[1].args[0].page, 0);
  r.calls.newsletters.calls[1].resolve(list(['fresh'], 1));
  await refresh;
  assert.deepEqual(listIds(view), ['fresh']);
});

test('unsubscribing cancels the HTTP signal and ignores the old completion on remount', async () => {
  const r = setup();
  const { newsletterListOptions } = r.load('src/query/options.ts');
  const options = newsletterListOptions(r.scope(), 'A', undefined);
  const first = r.observe(options, true);
  const old = r.calls.newsletters.calls[0];
  first.dispose();
  assert.equal(old.args[1].aborted, true);
  const second = r.observe(options, true);
  old.resolve(list(['old']));
  r.calls.newsletters.calls[1].resolve(list(['new']));
  await r.flush();
  assert.deepEqual(listIds(second), ['new']);
});

test('query keys isolate languages and authenticated account generations', async () => {
  const r = setup();
  const { newsletterListOptions } = r.load('src/query/options.ts');
  const ko = newsletterListOptions(r.scope('ko'), 'A', undefined);
  const en = newsletterListOptions(r.scope('en'), 'A', undefined);
  assert.notDeepEqual(ko.queryKey, en.queryKey);
  r.client.setQueryData(ko.queryKey, { pages: [list(['private'])], pageParams: [0] });
  r.session.invalidateSession();
  assert.equal(r.client.getQueryData(ko.queryKey), undefined);
  r.session.markSessionAuthenticated(r.session.getSessionVersion());
  assert.notDeepEqual(ko.queryKey, newsletterListOptions(r.scope(), 'A', undefined).queryKey);
});

const checklist = (id, isCompleted = false) => ({ checklistId: id, isCompleted });
const rows = () => [checklist(1), checklist(2), checklist(3)];
const values = (data) => Array.from(data, (row) => [row.checklistId, row.isCompleted]);

['success', 'failure'].forEach((firstOutcome) => {
  test(`queued toggle rolls back to its execution-time value after an earlier ${firstOutcome}`, async () => {
    const r = setup();
    const refresh = queuedApi();
    const { changeChecklist } = r.load('src/query/checklists.ts');
    const view = r.observe({
      ...r
        .load('src/query/options.ts')
        .serverOptions(r.scope(), 'newsletterChecklist', [1], refresh.request),
      initialData: [checklist(1)],
      staleTime: Infinity,
    });
    const first = changeChecklist(1, false, true).catch(() => {});
    const second = changeChecklist(1, true, false).catch(() => {});
    await r.flush();
    if (firstOutcome === 'success') r.calls.toggle.calls[0].resolve();
    else r.calls.toggle.calls[0].reject(new Error('First PATCH failed'));
    await first;
    await r.flush();
    assert.equal(r.calls.toggle.calls.length, 2);
    assert.equal(view.result.data[0].isCompleted, false);
    r.calls.toggle.calls[1].reject(new Error('Second PATCH failed'));
    await second;
    await r.flush();
    refresh.calls.at(-1).reject(new Error('Final reconciliation failed'));
    await r.flush();
    assert.equal(view.result.isRefetchError, true);
    assert.equal(view.result.data[0].isCompleted, firstOutcome === 'success');
  });
});

['newsletterChecklist', 'calendar'].forEach((domain) => {
  const seed = (r) => {
    const key = r.key(domain, 1);
    const data = domain === 'calendar' ? { events: [{ eventId: 10, checklists: rows() }] } : rows();
    r.client.setQueryData(key, data);
    const current = () =>
      domain === 'calendar'
        ? (r.client.getQueryData(key).events[0]?.checklists ?? [])
        : r.client.getQueryData(key);
    return { key, current };
  };
  test(`${domain}: one failed optimistic change cannot undo another successful change`, async () => {
    const r = setup();
    const { changeChecklist } = r.load('src/query/checklists.ts');
    const { current } = seed(r);
    const first = changeChecklist(1, false, true).catch(() => {});
    const second = changeChecklist(2, false, true);
    await r.flush();
    r.calls.toggle.calls[1].resolve();
    await second;
    r.calls.toggle.calls[0].reject(new Error('Failed first change'));
    await first;
    assert.deepEqual(values(current()), [
      [1, false],
      [2, true],
      [3, false],
    ]);
  });
  test(`${domain}: deletion waits for the same item's toggle and runs once`, async () => {
    const r = setup();
    const { changeChecklist } = r.load('src/query/checklists.ts');
    seed(r);
    const first = changeChecklist(1, false, true);
    const duplicate = changeChecklist(1, false);
    const repeatedDelete = changeChecklist(1, false);
    await r.flush();
    assert.equal(r.calls.toggle.calls.length, 1);
    assert.equal(r.calls.remove.calls.length, 0);
    r.calls.toggle.calls[0].resolve();
    await first;
    await r.flush();
    assert.equal(r.calls.remove.calls.length, 1);
    r.calls.remove.calls[0].resolve();
    await Promise.all([duplicate, repeatedDelete]);
  });
  test(`${domain}: a refresh started before a completed change cannot restore its old value`, async () => {
    const r = setup();
    const { changeChecklist } = r.load('src/query/checklists.ts');
    const { serverOptions } = r.load('src/query/options.ts');
    const { key, current } = seed(r);
    const pending = changeChecklist(1, false, true);
    await r.flush();
    let resolve;
    const response = new Promise((done) => {
      resolve = done;
    });
    const refresh = r.client.fetchQuery(serverOptions(r.scope(), domain, [1], () => response));
    await r.flush();
    r.calls.toggle.calls[0].resolve();
    await pending;
    resolve(domain === 'calendar' ? { events: [{ eventId: 10, checklists: rows() }] } : rows());
    await refresh;
    assert.equal(current()[0].isCompleted, true);
    assert.equal(r.client.getQueryState(key).status, 'success');
  });
  test(`${domain}: optimistic state is preserved during a refresh and rolls back after failure`, async () => {
    const r = setup();
    const { changeChecklist } = r.load('src/query/checklists.ts');
    const { serverOptions } = r.load('src/query/options.ts');
    const { current } = seed(r);
    const pending = changeChecklist(1, false, true).catch(() => {});
    await r.flush();
    await r.client.fetchQuery(
      serverOptions(r.scope(), domain, [1], async () =>
        domain === 'calendar' ? { events: [{ eventId: 10, checklists: rows() }] } : rows()
      )
    );
    assert.equal(current()[0].isCompleted, true);
    r.calls.toggle.calls[0].reject(new Error('Lost write'));
    await pending;
    assert.equal(current()[0].isCompleted, false);
  });
});

[
  [1, 2],
  [2, 1],
].forEach((startOrder) => {
  ['forward', 'reverse'].forEach((order) => {
    test(`concurrent failed deletions preserve order (start ${startOrder}, fail ${order})`, async () => {
      const r = setup();
      const { changeChecklist } = r.load('src/query/checklists.ts');
      const key = r.key('newsletterChecklist', 1);
      r.client.setQueryData(key, rows());
      const first = changeChecklist(startOrder[0], false).catch(() => {});
      await r.flush();
      const second = changeChecklist(startOrder[1], false).catch(() => {});
      await r.flush();
      const orderIndexes = order === 'forward' ? [0, 1] : [1, 0];
      r.calls.remove.calls[orderIndexes[0]].reject(new Error('First failure'));
      await r.flush();
      r.calls.remove.calls[orderIndexes[1]].reject(new Error('Second failure'));
      await Promise.all([first, second]);
      assert.deepEqual(
        Array.from(r.client.getQueryData(key), (row) => row.checklistId),
        [1, 2, 3]
      );
    });
  });
});

test('failed deletion preserves a successful deletion and another completed toggle', async () => {
  const r = setup();
  const { changeChecklist } = r.load('src/query/checklists.ts');
  const key = r.key('newsletterChecklist', 1);
  r.client.setQueryData(key, rows());
  const first = changeChecklist(1, false).catch(() => {});
  await r.flush();
  const second = changeChecklist(2, false);
  const toggle = changeChecklist(3, false, true);
  await r.flush();
  r.calls.remove.calls[1].resolve();
  r.calls.toggle.calls[0].resolve();
  await Promise.all([second, toggle]);
  r.calls.remove.calls[0].reject(new Error('First deletion failed'));
  await first;
  assert.deepEqual(values(r.client.getQueryData(key)), [
    [1, false],
    [3, true],
  ]);
});

test('a failed checklist write cannot restore an event that was successfully deleted', async () => {
  const r = setup();
  const { changeChecklist, removeCalendarEvent } = r.load('src/query/checklists.ts');
  const key = r.key('calendar', 'day');
  r.client.setQueryData(key, { events: [{ eventId: 10, checklists: rows() }] });
  const change = changeChecklist(1, false, true).catch(() => {});
  await r.flush();
  const remove = removeCalendarEvent(10);
  r.calls.deleteEvent.calls[0].resolve();
  await remove;
  r.calls.toggle.calls[0].reject(new Error('Late failure'));
  await change;
  assert.equal(r.client.getQueryData(key).events.length, 0);
});

test('an old mutation completion cannot populate a new account cache', async () => {
  const r = setup();
  const { changeChecklist } = r.load('src/query/checklists.ts');
  r.client.setQueryData(r.key('newsletterChecklist', 1), rows());
  const pending = changeChecklist(1, false, true).catch(() => {});
  await r.flush();
  r.session.invalidateSession();
  r.session.markSessionAuthenticated(r.session.getSessionVersion());
  const key = r.key('newsletterChecklist', 1);
  r.client.setQueryData(key, rows());
  r.calls.toggle.calls[0].resolve();
  await pending;
  assert.deepEqual(values(r.client.getQueryData(key)), [
    [1, false],
    [2, false],
    [3, false],
  ]);
});

test('a new optimistic write preserves authoritative changes to a previously updated item', async () => {
  const r = setup();
  const { changeChecklist } = r.load('src/query/checklists.ts');
  const { serverOptions } = r.load('src/query/options.ts');
  const key = r.key('newsletterChecklist', 1);
  r.client.setQueryData(key, rows());
  const first = changeChecklist(1, false, true);
  await r.flush();
  r.calls.toggle.calls[0].resolve();
  await first;
  await r.client.fetchQuery(
    serverOptions(r.scope(), 'newsletterChecklist', [1], async () => rows())
  );
  const second = changeChecklist(2, false, true);
  await r.flush();
  assert.deepEqual(values(r.client.getQueryData(key)), [
    [1, false],
    [2, true],
    [3, false],
  ]);
  r.calls.toggle.calls[1].resolve();
  await second;
});

test('failed writes restore queries first loaded while the optimistic change was pending', async () => {
  const r = setup();
  const { changeChecklist } = r.load('src/query/checklists.ts');
  const { serverOptions } = r.load('src/query/options.ts');
  r.client.setQueryData(r.key('newsletterChecklist', 1), rows());
  const pending = changeChecklist(1, false, true).catch(() => {});
  await r.flush();
  const key = r.key('calendar', 'new-day');
  await r.client.fetchQuery(
    serverOptions(r.scope(), 'calendar', ['new-day'], async () => ({
      events: [{ eventId: 10, checklists: rows() }],
    }))
  );
  assert.equal(r.client.getQueryData(key).events[0].checklists[0].isCompleted, true);
  r.calls.toggle.calls[0].reject(new Error('Failed write'));
  await pending;
  assert.equal(r.client.getQueryData(key).events[0].checklists[0].isCompleted, false);
});

test('a lost mutation response refetches the server to reconcile its actual outcome', async () => {
  const r = setup();
  const api = queuedApi();
  const { changeChecklist } = r.load('src/query/checklists.ts');
  const { serverOptions } = r.load('src/query/options.ts');
  const view = r.observe(serverOptions(r.scope(), 'newsletterChecklist', [1], api.request));
  api.calls[0].resolve(rows());
  await r.flush();
  const pending = changeChecklist(1, false, true).catch(() => {});
  await r.flush();
  r.calls.toggle.calls[0].reject(new Error('Response lost after server committed'));
  await pending;
  await r.flush();
  assert.equal(api.calls.length, 2);
  api.calls[1].resolve([checklist(1, true), checklist(2), checklist(3)]);
  await r.flush();
  assert.equal(view.result.data[0].isCompleted, true);
});
