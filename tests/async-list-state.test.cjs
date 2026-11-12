/* eslint-env node */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { hookHarness, queuedApi } = require('./helpers/hookHarness.cjs');

const listResult = (ids, totalCount = 5) => ({
  newsletters: ids.map((newsletterId) => ({ newsletterId })),
  totalCount,
});
const listIds = (runner) => Array.from(runner.result.newsletters, (item) => item.newsletterId);
const checklistItems = (values = [false, false, false]) =>
  values.map((isCompleted, index) => ({
    checklistId: index + 1,
    isCompleted,
    content: `item-${index + 1}`,
  }));
const itemValues = (items) => Array.from(items, (item) => [item.checklistId, item.isCompleted]);

const documentSetup = async () => {
  const fetch = queuedApi();
  const runner = hookHarness('src/hooks/document/useNewsletterList.ts', {
    '../../api/newsletter': { fetchNewsletters: fetch.request },
  });
  runner.render('A', '');
  runner.runTimers();
  fetch.calls[0].resolve(listResult(['A0']));
  await runner.flush();
  return { runner, fetch };
};

['child', 'search'].forEach((condition) => {
  test(`document pagination ignores the old ${condition} response after the new first page`, async () => {
    const { runner, fetch } = await documentSetup();
    const oldMore = runner.result.loadMore();
    runner.render(condition === 'child' ? 'B' : 'A', condition === 'search' ? 'new' : '');
    runner.runTimers();
    fetch.calls[2].resolve(listResult(['B0']));
    await runner.flush();
    fetch.calls[1].resolve(listResult(['A1']));
    await oldMore;
    await runner.flush();
    assert.deepEqual(listIds(runner), ['B0']);
    const next = runner.result.loadMore();
    assert.equal(fetch.calls[3].args[0].page, 1);
    assert.equal(fetch.calls[3].args[0].childName, condition === 'child' ? 'B' : 'A');
    assert.equal(fetch.calls[3].args[0].search, condition === 'search' ? 'new' : undefined);
    fetch.calls[3].resolve(listResult(['B1']));
    await next;
  });
});

test('document filters invalidate old pagination during the debounce delay', async () => {
  const { runner, fetch } = await documentSetup();
  const pending = runner.result.loadMore();
  runner.render('B', '');
  fetch.calls[1].resolve(listResult(['A1']));
  await pending;
  await runner.flush();
  assert.deepEqual(listIds(runner), []);
  assert.equal(runner.result.isLoading, true);
  await runner.result.loadMore();
  assert.equal(fetch.calls.length, 2);
});

test('an old pagination completion cannot unlock a newer pagination request', async () => {
  const { runner, fetch } = await documentSetup();
  const oldMore = runner.result.loadMore();
  runner.render('B', '');
  runner.runTimers();
  fetch.calls[2].resolve(listResult(['B0']));
  await runner.flush();
  const newMore = runner.result.loadMore();
  fetch.calls[1].reject(new Error('Old page failed'));
  await oldMore;
  await runner.flush();
  assert.equal(runner.result.isLoadingMore, true);
  await runner.result.loadMore();
  assert.equal(fetch.calls.length, 4);
  fetch.calls[3].resolve(listResult(['B1']));
  await newMore;
});

test('pagination is locked synchronously and retries the same page after failure', async () => {
  const { runner, fetch } = await documentSetup();
  const first = runner.result.loadMore();
  await runner.result.loadMore();
  assert.equal(fetch.calls.length, 2);
  fetch.calls[1].reject(new Error('Network failed'));
  await first;
  const retry = runner.result.loadMore();
  assert.equal(fetch.calls[2].args[0].page, 1);
  fetch.calls[2].resolve(listResult(['A1']));
  await retry;
});

test('returning to the same filter cannot accept its previous request', async () => {
  const { runner, fetch } = await documentSetup();
  const oldMore = runner.result.loadMore();
  runner.render('B', '');
  runner.render('A', '');
  runner.runTimers();
  fetch.calls[2].resolve(listResult(['A-new']));
  await runner.flush();
  fetch.calls[1].resolve(listResult(['A-old']));
  await oldMore;
  await runner.flush();
  assert.deepEqual(listIds(runner), ['A-new']);
});

test('refocusing starts a fresh list and discards old pending pagination', async () => {
  const { runner, fetch } = await documentSetup();
  const oldMore = runner.result.loadMore();
  runner.blur();
  runner.focus();
  fetch.calls[2].resolve(listResult(['fresh']));
  await runner.flush();
  fetch.calls[1].resolve(listResult(['old']));
  await oldMore;
  await runner.flush();
  assert.deepEqual(listIds(runner), ['fresh']);
});

test('list responses after unmount do not update state', async () => {
  const { runner, fetch } = await documentSetup();
  const pending = runner.result.loadMore();
  runner.unmount();
  fetch.calls[1].resolve(listResult(['late']));
  await pending;
  assert.equal(runner.postUnmountUpdates, 0);
});

const calendarSetup = async (weekly = false) => {
  const daily = queuedApi();
  const week = queuedApi();
  const complete = queuedApi();
  const remove = queuedApi();
  const runner = hookHarness('src/hooks/calendar/useCalendarEvents.ts', {
    '../../api/calendar': {
      fetchDailyEvents: daily.request,
      fetchWeeklyEvents: week.request,
      completeChecklist: complete.request,
      deleteCalendarEvent: remove.request,
    },
    '../../utils/calendarWeek': {
      getWeeklyQueryDate: (dates) => dates[0],
      orderWeekDates: (dates) => dates,
    },
    '../../utils/schoolSchedule': {
      getHolidaysForDate: () => [],
      getAcademicSchedulesForDate: () => [],
      getSchoolDotsForDate: () => [],
    },
  });
  const params = {
    isWeekMode: weekly,
    weekDates: ['2026-11-12'],
    selectedDate: '2026-11-12',
    selectedChildName: 'A',
    selectedChildId: 1,
    focusKey: 0,
    commonHolidays: [],
    schoolGroups: [],
  };
  const events = (values) => [
    { eventId: 10, checklists: checklistItems(values), childName: 'A', calendarColor: '#ffffff' },
  ];
  const result = (values) =>
    weekly
      ? { days: [{ date: '2026-11-12', events: events(values) }] }
      : { events: events(values) };
  const source = weekly ? week : daily;
  runner.render(params);
  source.calls[0].resolve(result([false, false]));
  await runner.flush();
  const currentItems = () =>
    weekly
      ? runner.result.weeklyData.days[0].events[0]?.checklists
      : runner.result.dayEvents[0]?.checklists;
  return { runner, params, source, result, complete, remove, currentItems };
};

[false, true].forEach((weekly) => {
  test(`${weekly ? 'weekly' : 'daily'} checklist failure preserves another successful change`, async () => {
    const app = await calendarSetup(weekly);
    const first = app.runner.result.toggleCheck(10, 1);
    await app.runner.flush();
    const second = app.runner.result.toggleCheck(10, 2);
    app.complete.calls[1].resolve();
    await second;
    app.complete.calls[0].reject(new Error('First failed'));
    await first;
    await app.runner.flush();
    assert.deepEqual(itemValues(app.currentItems()), [
      [1, false],
      [2, true],
    ]);
  });

  test(`${weekly ? 'weekly' : 'daily'} checklist rollback cannot overwrite a new filter`, async () => {
    const app = await calendarSetup(weekly);
    const oldToggle = app.runner.result.toggleCheck(10, 1);
    app.runner.render({ ...app.params, selectedChildName: 'B' });
    app.source.calls[1].resolve(app.result([true, true]));
    await app.runner.flush();
    app.complete.calls[0].reject(new Error('Old toggle failed'));
    await oldToggle;
    await app.runner.flush();
    assert.deepEqual(itemValues(app.currentItems()), [
      [1, true],
      [2, true],
    ]);
  });
});

test('calendar checklist requests lock the same item until completion', async () => {
  const app = await calendarSetup();
  const pending = app.runner.result.toggleCheck(10, 1);
  await app.runner.result.toggleCheck(10, 1);
  assert.equal(app.complete.calls.length, 1);
  app.complete.calls[0].reject(new Error('Failed'));
  await pending;
  await app.runner.flush();
  const retry = app.runner.result.toggleCheck(10, 1);
  assert.equal(app.complete.calls.length, 2);
  app.complete.calls[1].resolve();
  await retry;
});

test('a failed checklist request cannot restore an event that was deleted', async () => {
  const app = await calendarSetup();
  const pending = app.runner.result.toggleCheck(10, 1);
  const removal = app.runner.result.deleteEvent(10);
  app.remove.calls[0].resolve();
  await removal;
  app.complete.calls[0].reject(new Error('Failed'));
  await pending;
  await app.runner.flush();
  assert.equal(app.runner.result.dayEvents.length, 0);
});

const checklistSetup = async (values = [false, false, false]) => {
  const fetch = queuedApi();
  const complete = queuedApi();
  const remove = queuedApi();
  const runner = hookHarness('src/hooks/scan/useNewsletterChecklist.ts', {
    '../../api/newsletter': {
      getNewsletterChecklist: fetch.request,
      NewsletterApiError: class extends Error {},
    },
    '../../api/checklist': {
      toggleChecklistItem: complete.request,
      deleteChecklistItem: remove.request,
    },
  });
  runner.render(1);
  fetch.calls[0].resolve(checklistItems(values));
  await runner.flush();
  return { runner, fetch, complete, remove };
};

test('document checklist failure only rolls back the failed item', async () => {
  const app = await checklistSetup();
  const first = app.runner.result.toggle(1);
  await app.runner.flush();
  const second = app.runner.result.toggle(2);
  app.complete.calls[1].resolve();
  await second;
  app.complete.calls[0].reject(new Error('First failed'));
  await first;
  await app.runner.flush();
  assert.deepEqual(itemValues(app.runner.result.items), [
    [1, false],
    [2, true],
    [3, false],
  ]);
});

test('failed deletion preserves another completed toggle', async () => {
  const app = await checklistSetup([true, false, false]);
  const removal = app.runner.result.remove(1);
  await app.runner.flush();
  const toggle = app.runner.result.toggle(2);
  app.complete.calls[0].resolve();
  await toggle;
  app.remove.calls[0].reject(new Error('Delete failed'));
  await removal;
  await app.runner.flush();
  assert.deepEqual(itemValues(app.runner.result.items), [
    [1, true],
    [2, true],
    [3, false],
  ]);
});

test('failed deletion does not restore another successfully deleted item', async () => {
  const app = await checklistSetup([true, true, true]);
  const first = app.runner.result.remove(1);
  await app.runner.flush();
  const second = app.runner.result.remove(2);
  app.remove.calls[1].resolve();
  await second;
  app.remove.calls[0].reject(new Error('First failed'));
  await first;
  await app.runner.flush();
  assert.deepEqual(itemValues(app.runner.result.items), [
    [1, true],
    [3, true],
  ]);
});

[false, true].forEach((reverse) => {
  test(`failed concurrent deletions preserve original order (${reverse ? 'reverse' : 'forward'} completion)`, async () => {
    const app = await checklistSetup([true, true, true, true]);
    const first = app.runner.result.remove(2);
    await app.runner.flush();
    const second = app.runner.result.remove(3);
    const order = reverse ? [1, 0] : [0, 1];
    const pending = [first, second];
    await order.reduce(async (previous, index) => {
      await previous;
      app.remove.calls[index].reject(new Error('Delete failed'));
      await pending[index];
      await app.runner.flush();
    }, Promise.resolve());
    assert.deepEqual(itemValues(app.runner.result.items), [
      [1, true],
      [2, true],
      [3, true],
      [4, true],
    ]);
  });
});

test('toggle and deletion share the same item lock', async () => {
  const app = await checklistSetup([true]);
  const pending = app.runner.result.toggle(1);
  await app.runner.result.toggle(1);
  await app.runner.result.remove(1);
  assert.equal(app.complete.calls.length, 1);
  assert.equal(app.remove.calls.length, 0);
  app.complete.calls[0].resolve();
  await pending;
});

test('old document mutation failures cannot change the next document', async () => {
  const app = await checklistSetup([false]);
  const pending = app.runner.result.toggle(1);
  app.runner.render(2);
  app.fetch.calls[1].resolve(checklistItems([true]));
  await app.runner.flush();
  app.complete.calls[0].reject(new Error('Old failure'));
  await pending;
  await app.runner.flush();
  assert.deepEqual(itemValues(app.runner.result.items), [[1, true]]);
});

test('old document fetches cannot overwrite the next document', async () => {
  const app = await checklistSetup();
  app.runner.render(2);
  app.runner.render(3);
  app.fetch.calls[2].resolve(checklistItems([true]));
  await app.runner.flush();
  app.fetch.calls[1].resolve(checklistItems([false]));
  await app.runner.flush();
  assert.deepEqual(itemValues(app.runner.result.items), [[1, true]]);
});

test('failed document deletion after unmount does not restore state', async () => {
  const app = await checklistSetup([true]);
  const pending = app.runner.result.remove(1);
  app.runner.unmount();
  app.remove.calls[0].reject(new Error('Failed after unmount'));
  await pending;
  assert.equal(app.runner.postUnmountUpdates, 0);
});

test('failed same-query refresh keeps the loaded pages available for pagination', async () => {
  const { runner, fetch } = await documentSetup();
  const firstMore = runner.result.loadMore();
  fetch.calls[1].resolve(listResult(['A1']));
  await firstMore;
  await runner.flush();
  runner.blur();
  runner.focus();
  fetch.calls[2].reject(new Error('Refresh failed'));
  await runner.flush();
  assert.deepEqual(listIds(runner), ['A0', 'A1']);
  const next = runner.result.loadMore();
  assert.equal(fetch.calls.length, 4);
  assert.equal(fetch.calls[3].args[0].page, 2);
  fetch.calls[3].resolve(listResult(['A2']));
  await next;
});

test('failed weekly filter loading cannot display the previous child events', async () => {
  const app = await calendarSetup(true);
  app.runner.render({ ...app.params, selectedChildName: 'B' });
  app.source.calls[1].reject(new Error('New filter failed'));
  await app.runner.flush();
  assert.equal(app.runner.result.weeklyData, null);
  assert.equal(app.runner.result.weekEventsLoading, false);
});

test('an old daily fetch cannot resurrect a successfully deleted event', async () => {
  const app = await calendarSetup();
  const removal = app.runner.result.deleteEvent(10);
  app.runner.render({ ...app.params, focusKey: 1 });
  app.remove.calls[0].resolve();
  await removal;
  app.source.calls[1].resolve(app.result([false, false]));
  await app.runner.flush();
  assert.equal(app.runner.result.dayEvents.length, 0);
});

test('failed same-query weekly refresh retains existing events', async () => {
  const app = await calendarSetup(true);
  const previous = app.runner.result.weeklyData;
  app.runner.render({ ...app.params, focusKey: 1 });
  app.source.calls[1].reject(new Error('Refresh failed'));
  await app.runner.flush();
  assert.equal(app.runner.result.weeklyData, previous);
  assert.equal(app.runner.result.weekEventsLoading, false);
});

test('failed weekly date change cannot display the previous week events', async () => {
  const app = await calendarSetup(true);
  app.runner.render({ ...app.params, weekDates: ['2026-11-19'] });
  assert.equal(app.source.calls[1].args[0], '2026-11-19');
  app.source.calls[1].reject(new Error('New week failed'));
  await app.runner.flush();
  assert.equal(app.runner.result.weeklyData, null);
  assert.equal(app.runner.result.weekEventsLoading, false);
});
