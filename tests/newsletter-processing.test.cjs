/* eslint-env node */
const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const { QueryObserver, MutationObserver } = require('@tanstack/react-query');
const axios = require('axios');
const { hookHarness, queuedApi } = require('./helpers/hookHarness.cjs');
const { queryRuntime } = require('./helpers/queryRuntime.cjs');

const cleanups = [];
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup());
});

const snapshot = (status, extra = {}) => ({
  status,
  progressPercent: status === 'COMPLETED' ? 100 : 30,
  progressMessage: '',
  ...extra,
});
const paused = () => snapshot('PAUSED', { pausedPageNo: 2, retryable: true, skippable: true });

const setup = (
  input = { photoUris: ['first.jpg'], childId: 1 },
  { automaticRetry = false, realHooks = false } = {}
) => {
  const api = Object.fromEntries(
    ['upload', 'resume', 'retry', 'skip', 'status'].map((name) => [name, queuedApi()])
  );
  const runtime = queryRuntime();
  cleanups.push(runtime.dispose);
  if (automaticRetry) {
    runtime.client.setDefaultOptions({
      queries: {
        ...runtime.client.getDefaultOptions().queries,
        retry: runtime.defaults.queries.retry,
        retryDelay: 0,
      },
    });
  }
  let options;
  let observer;
  const runner = hookHarness(
    'src/hooks/scan/useNewsletterProcessing.ts',
    (react, focused) => {
      const useQuery = (inputOptions) => {
        options = { ...inputOptions, _optimisticResults: 'optimistic' };
        const [view] = react.useState(() => new QueryObserver(runtime.client, options));
        observer = view;
        const result = view.getOptimisticResult(options);
        react.useEffect(() => view.setOptions(options), [view, options]);
        const active = focused() && options.subscribed !== false;
        react.useSyncExternalStore(
          react.useCallback(
            (notify) => {
              if (!active) return () => {};
              const unsubscribe = view.subscribe(notify);
              view.updateResult();
              return unsubscribe;
            },
            [view, active]
          ),
          () => view.getCurrentResult()
        );
        return result;
      };
      return {
        axios,
        '@react-navigation/native': { useIsFocused: focused },
        'react-i18next': { useTranslation: () => ({ i18n: { language: 'ko' } }) },
        '@tanstack/react-query': {
          useQuery,
          useMutation: (mutationOptions) => {
            const [mutation] = react.useState(
              () => new MutationObserver(runtime.client, mutationOptions)
            );
            react.useEffect(
              () => mutation.setOptions(mutationOptions),
              [mutation, mutationOptions]
            );
            return { mutateAsync: mutation.mutate };
          },
        },
        '../../api/newsletter': {
          uploadNewsletter: api.upload.request,
          resumeNewsletter: api.resume.request,
          retryAnalysis: api.retry.request,
          skipNewsletterPage: api.skip.request,
          getNewsletterStatus: api.status.request,
        },
        '../../query/client': runtime.load('src/query/client.ts'),
        '../../query/state': runtime.load('src/query/state.ts'),
        '../../utils/authSession': runtime.session,
        '../utils/authSession': runtime.session,
        './client': runtime.load('src/query/client.ts'),
        './options': runtime.load('src/query/options.ts'),
        '../../query/hooks': {
          useApiMutation: (fn) => fn,
          useSessionScope: () => ({
            ...react.useSyncExternalStore(
              runtime.session.subscribeSession,
              runtime.session.getSessionSnapshot
            ),
            language: 'ko',
          }),
          useServerQuery: (domain, params, fetch, queryOptions) =>
            useQuery({
              ...runtime
                .load('src/query/options.ts')
                .serverOptions(runtime.scope(), domain, params, fetch),
              ...queryOptions,
            }),
        },
      };
    },
    {},
    'default',
    realHooks ? ['src/query/hooks.ts'] : []
  );
  cleanups.push(runner.unmount);
  runner.render(input);
  return {
    api,
    runtime,
    runner,
    get result() {
      return runner.result;
    },
    open: (next, beforeEffects = false) =>
      beforeEffects ? runner.renderBeforeEffects(next) : runner.render(next),
    poll: () => observer.refetch({ throwOnError: true }),
    interval: () => options.refetchInterval({ state: observer.getCurrentQuery().state }),
  };
};

const waitFor = async (
  screen,
  predicate,
  message = 'Expected processing state was not reached'
) => {
  const deadline = Date.now() + 5000;
  const check = async () => {
    await screen.runner.flush();
    if (predicate()) return;
    assert.ok(Date.now() < deadline, message);
    await check();
  };
  await check();
};

const start = async (screen, status = paused()) => {
  await waitFor(screen, () => screen.api.upload.calls.length === 1);
  screen.api.upload.calls[0].resolve({ newsletterId: 1, status: 'PENDING' });
  await waitFor(screen, () => screen.api.status.calls.length === 1);
  screen.api.status.calls[0].resolve(status);
  await waitFor(screen, () => screen.result.status?.status === status.status);
};

test('upload starts once across rerenders and processing polls until completion invalidates results', async () => {
  const screen = setup();
  screen.runtime.client.setQueryData(screen.runtime.key('summary', 1), { old: true });
  screen.runner.render();
  assert.equal(screen.api.upload.calls.length, 1);
  assert.equal(screen.result.phase, 'starting');
  await start(screen, snapshot('PROCESSING'));
  assert.equal(screen.result.phase, 'processing');
  assert.equal(screen.interval(), 2000);
  const poll = screen.poll();
  screen.api.status.calls[1].resolve(snapshot('COMPLETED'));
  await poll;
  await screen.runner.flush();
  assert.equal(screen.result.phase, 'completed');
  assert.equal(screen.interval(), false);
  assert.equal(
    screen.runtime.client.getQueryState(screen.runtime.key('summary', 1)).isInvalidated,
    true
  );
  assert.equal(screen.api.retry.calls.length, 0);
});

['retry', 'skipPage'].forEach((action) => {
  const apiName = action === 'retry' ? 'resume' : 'skip';
  test(`${action} serializes commands before rerender and refreshes the server after success`, async () => {
    const screen = setup();
    await start(screen);
    assert.equal(screen.result.phase, 'paused');
    assert.equal(screen.interval(), false);
    const pending = screen.result[action]();
    screen.result.retry();
    screen.result.skipPage();
    assert.equal(screen.api[apiName].calls.length, 1);
    assert.equal(screen.api.resume.calls.length + screen.api.skip.calls.length, 1);
    screen.runner.render();
    assert.equal(screen.result.action, action === 'retry' ? 'retry' : 'skip');
    screen.api[apiName].calls[0].resolve({ newsletterId: 1, status: 'PROCESSING' });
    await screen.runner.flush();
    assert.equal(screen.api.status.calls.length, 2);
    screen.api.status.calls[1].resolve(snapshot('PROCESSING'));
    await pending;
    await screen.runner.flush();
    assert.equal(screen.result.action, null);
    assert.equal(screen.result.phase, 'processing');
    assert.equal(screen.interval(), 2000);
  });

  test(`${action} failure retains the paused snapshot and allows another attempt`, async () => {
    const screen = setup();
    await start(screen);
    const pending = screen.result[action]();
    screen.api[apiName].calls[0].reject(new Error('Write failed'));
    await pending;
    await screen.runner.flush();
    assert.equal(screen.result.phase, 'paused');
    assert.equal(screen.result.error.kind, 'action');
    assert.equal(screen.result.status.pausedPageNo, 2);
    assert.equal(screen.result.action, null);
    const retry = screen.result[action]();
    screen.api[apiName].calls[1].resolve({ newsletterId: 1, status: 'PROCESSING' });
    await screen.runner.flush();
    screen.api.status.calls[1].resolve(snapshot('COMPLETED'));
    await retry;
    await screen.runner.flush();
    assert.equal(screen.result.phase, 'completed');
    assert.equal(screen.result.error, null);
  });

  ['success', 'failure'].forEach((outcome) => {
    test(`old ${action} ${outcome} cannot refresh, alert or unlock another document`, async () => {
      const screen = setup();
      await start(screen);
      const oldCallback = screen.result[action];
      const old = oldCallback();
      screen.open({ photoUris: ['second.jpg'], childId: 2 });
      assert.equal(screen.result.newsletterId, null);
      assert.equal(screen.result.status, undefined);
      screen.api.upload.calls[1].resolve({ newsletterId: 2, status: 'PENDING' });
      await screen.runner.flush();
      screen.api.status.calls[1].resolve(paused());
      await screen.runner.flush();
      const current = screen.result[action]();
      await oldCallback();
      assert.equal(screen.api[apiName].calls.length, 2);
      if (outcome === 'success') screen.api[apiName].calls[0].resolve({ status: 'PROCESSING' });
      else screen.api[apiName].calls[0].reject(new Error('Old failure'));
      await old;
      await screen.runner.flush();
      assert.equal(screen.result.newsletterId, 2);
      assert.equal(screen.result.error, null);
      assert.equal(screen.result.action, action === 'retry' ? 'retry' : 'skip');
      assert.equal(screen.api.status.calls.length, 2);
      screen.api[apiName].calls[1].resolve({ status: 'PROCESSING' });
      await screen.runner.flush();
      screen.api.status.calls[2].resolve(snapshot('PROCESSING'));
      await current;
      await screen.runner.flush();
      assert.equal(screen.result.action, null);
    });
  });
});

test('a committed input change invalidates pending commands before passive effects', async () => {
  const screen = setup();
  await start(screen);
  const pending = screen.result.retry();
  screen.open({ photoUris: ['second.jpg'] }, true);
  screen.api.resume.calls[0].reject(new Error('Late failure'));
  await pending;
  assert.equal(screen.result.error, null);
  assert.equal(screen.result.status, undefined);
  screen.runner.render();
  assert.equal(screen.api.upload.calls.length, 2);
});

['blur', 'unmount', 'session'].forEach((exit) => {
  test(`${exit} ignores late write errors and retained callbacks`, async () => {
    const screen = setup();
    await start(screen);
    const { retry } = screen.result;
    const pending = retry();
    if (exit === 'session') screen.runtime.session.invalidateSession();
    else screen.runner[exit]();
    screen.api.resume.calls[0].reject(new Error('Late failure'));
    await pending;
    await retry();
    assert.equal(screen.api.resume.calls.length, 1);
    assert.equal(screen.runner.postUnmountUpdates, 0);
    assert.equal(screen.result.error, null);
    if (exit === 'blur') {
      screen.runner.focus();
      await screen.runner.flush();
      assert.equal(screen.api.upload.calls.length, 1);
    }
  });
});

test('a new input ignores an older upload and starts polling only the new document', async () => {
  const screen = setup();
  screen.open({ photoUris: ['second.jpg'] });
  screen.api.upload.calls[0].resolve({ newsletterId: 1, status: 'PENDING' });
  await screen.runner.flush();
  assert.equal(screen.api.status.calls.length, 0);
  screen.api.upload.calls[1].resolve({ newsletterId: 2, status: 'PENDING' });
  await screen.runner.flush();
  assert.equal(screen.api.status.calls[0].args[0], 2);
  screen.api.status.calls[0].resolve(snapshot('PROCESSING'));
  await screen.runner.flush();
  assert.equal(screen.result.newsletterId, 2);
});

test('resume input uses resume instead of uploading and FAILED retries use the analysis endpoint', async () => {
  const screen = setup({ photoUris: [], resumeNewsletterId: 9 });
  assert.equal(screen.api.upload.calls.length, 0);
  assert.equal(screen.api.resume.calls[0].args[0], 9);
  screen.api.resume.calls[0].resolve({ newsletterId: 9, status: 'PROCESSING' });
  await screen.runner.flush();
  screen.api.status.calls[0].resolve(snapshot('FAILED', { canRetry: true }));
  await screen.runner.flush();
  assert.equal(screen.result.phase, 'failed');
  assert.equal(screen.interval(), false);
  const retry = screen.result.retry();
  assert.equal(screen.api.retry.calls[0].args[0], 9);
  screen.api.retry.calls[0].resolve({ newsletterId: 9, status: 'PROCESSING' });
  await screen.runner.flush();
  screen.api.status.calls[1].resolve(snapshot('PROCESSING'));
  await retry;
  await screen.runner.flush();
  assert.equal(screen.result.phase, 'processing');
});

test('non-retryable analysis and pause flags block retained action callbacks', async () => {
  const screen = setup();
  await start(screen, snapshot('FAILED', { canRetry: false }));
  await screen.result.retry();
  await screen.result.skipPage();
  assert.equal(screen.result.error.retryable, false);
  assert.equal(screen.api.retry.calls.length, 0);
  const poll = screen.poll();
  screen.api.status.calls[1].resolve(snapshot('PAUSED', { retryable: false, skippable: false }));
  await poll;
  await screen.runner.flush();
  await screen.result.retry();
  await screen.result.skipPage();
  assert.equal(screen.api.resume.calls.length + screen.api.skip.calls.length, 0);
});

[403, 503].forEach((status) => {
  test(`status HTTP ${status} stops polling and exposes the correct retry policy`, async () => {
    const screen = setup();
    screen.api.upload.calls[0].resolve({ newsletterId: 1, status: 'PENDING' });
    await screen.runner.flush();
    screen.api.status.calls[0].reject(Object.assign(new Error('Status failed'), { status }));
    await screen.runner.flush();
    assert.equal(screen.result.phase, 'error');
    assert.equal(screen.interval(), false);
    assert.equal(screen.result.error.retryable, status === 503);
    const retry = screen.result.retry();
    if (status === 503) {
      assert.equal(screen.api.status.calls.length, 2);
      screen.api.status.calls[1].resolve(snapshot('PROCESSING'));
    }
    await retry;
    await screen.runner.flush();
    assert.equal(screen.api.resume.calls.length, 0);
    assert.equal(screen.api.retry.calls.length, 0);
    assert.equal(screen.api.status.calls.length, status === 503 ? 2 : 1);
  });
});

test('an upload failure exposes the original error without enabling a write retry', async () => {
  const screen = setup();
  const error = new Error('Upload failed');
  screen.api.upload.calls[0].reject(error);
  await screen.runner.flush();
  assert.equal(screen.result.phase, 'error');
  assert.equal(screen.result.error.cause, error);
  assert.equal(screen.result.error.kind, 'start');
  await screen.result.retry();
  assert.equal(screen.api.upload.calls.length, 1);
});

[403, 404, 503].forEach((status) => {
  test(`HTTP ${status} on refresh takes precedence over a cached completed result`, async () => {
    const screen = setup();
    await start(screen, snapshot('COMPLETED'));
    const pending = screen.poll().catch(() => {});
    const cause = Object.assign(new Error('Status failed'), { status });
    screen.api.status.calls[1].reject(cause);
    await pending;
    await screen.runner.flush();
    assert.equal(screen.result.phase, 'error');
    assert.equal(screen.result.error.kind, 'status');
    assert.equal(screen.result.error.cause, cause);
    assert.equal(screen.result.error.retryable, status === 503);
    if (status === 503) {
      const retry = screen.result.retry();
      screen.runner.render();
      assert.equal(screen.result.phase, 'error');
      assert.equal(screen.result.action, 'retry');
      assert.equal(screen.result.error, null);
      screen.api.status.calls[2].resolve(snapshot('COMPLETED'));
      await retry;
      await screen.runner.flush();
      assert.equal(screen.result.phase, 'completed');
    }
  });
});

[403, 503].forEach((status) => {
  test(`HTTP ${status} on refresh replaces an earlier action error and determines retry permissions`, async () => {
    const screen = setup();
    await start(screen);
    const write = screen.result.retry();
    screen.api.resume.calls[0].reject(new Error('Network failed'));
    await write;
    await screen.runner.flush();
    assert.equal(screen.result.error.kind, 'action');
    const read = screen.poll().catch(() => {});
    const cause = Object.assign(new Error('Status failed'), { status });
    screen.api.status.calls[1].reject(cause);
    await read;
    await screen.runner.flush();
    assert.equal(screen.result.error.kind, 'status');
    assert.equal(screen.result.error.cause, cause);
    assert.equal(screen.result.error.retryable, status === 503);
    assert.equal(screen.result.canRetry, status === 503);
    assert.equal(screen.result.canSkip, false);
    const retry = screen.result.retry();
    if (status === 503) screen.api.status.calls[2].resolve(snapshot('PROCESSING'));
    await retry;
    assert.equal(screen.api.status.calls.length, status === 503 ? 3 : 2);
    assert.equal(screen.api.resume.calls.length, 1);
  });
});

test('equal input values with a new photo array preserve the current snapshot and pending action', async () => {
  const screen = setup();
  await start(screen);
  const pending = screen.result.retry();
  screen.open({ photoUris: ['first.jpg'], childId: 1 });
  assert.equal(screen.result.newsletterId, 1);
  assert.equal(screen.result.phase, 'paused');
  assert.equal(screen.result.action, 'retry');
  await screen.runner.flush();
  assert.equal(screen.api.status.calls.length, 1);
  assert.equal(screen.api.upload.calls.length, 1);
  assert.equal(screen.result.action, 'retry');
  screen.api.resume.calls[0].resolve({ newsletterId: 1, status: 'PROCESSING' });
  await screen.runner.flush();
  screen.api.status.calls[1].resolve(snapshot('PROCESSING'));
  await pending;
  await screen.runner.flush();
  assert.equal(screen.result.action, null);
});

test('a failed post-command status read retries only GET and does not replay the successful write', async () => {
  const screen = setup();
  await start(screen);
  const pending = screen.result.retry();
  screen.api.resume.calls[0].resolve({ newsletterId: 1, status: 'PROCESSING' });
  await screen.runner.flush();
  screen.api.status.calls[1].reject(Object.assign(new Error('Unavailable'), { status: 503 }));
  await pending;
  await screen.runner.flush();
  assert.equal(screen.result.error.kind, 'status');
  assert.equal(screen.result.error.retryable, true);
  const retry = screen.result.retry();
  assert.equal(screen.api.resume.calls.length, 1);
  assert.equal(screen.api.status.calls.length, 3);
  screen.api.status.calls[2].resolve(snapshot('COMPLETED'));
  await retry;
  await screen.runner.flush();
  assert.equal(screen.result.phase, 'completed');
});

test('returning while a write is pending keeps commands locked until the current status is refreshed', async () => {
  const screen = setup();
  await start(screen);
  const pending = screen.result.retry();
  screen.runner.blur();
  screen.runner.focus();
  await screen.runner.flush();
  assert.equal(screen.api.upload.calls.length, 1);
  assert.equal(screen.result.action, 'retry');
  await screen.result.skipPage();
  await screen.result.retry();
  assert.equal(screen.api.resume.calls.length, 1);
  assert.equal(screen.api.skip.calls.length, 0);
  screen.api.resume.calls[0].resolve({ newsletterId: 1, status: 'PROCESSING' });
  await pending;
  await screen.runner.flush();
  // Focus restoration may already have started a status request. Reconciliation replaces it.
  const read = screen.api.status.calls[screen.api.status.calls.length - 1];
  assert.equal(screen.result.action, 'retry');
  await screen.result.skipPage();
  assert.equal(screen.api.skip.calls.length, 0);
  read.resolve(snapshot('PROCESSING'));
  await screen.runner.flush();
  assert.equal(screen.result.action, null);
  assert.equal(screen.result.phase, 'processing');
});

test('a pre-command status read is cancelled and cannot overwrite the fresh result', async () => {
  const screen = setup();
  await start(screen);
  const oldRead = screen.poll().catch(() => {});
  const oldSignal = screen.api.status.calls[1].args[1];
  const pending = screen.result.retry();
  screen.api.resume.calls[0].resolve({ newsletterId: 1, status: 'PROCESSING' });
  await screen.runner.flush();
  assert.equal(oldSignal.aborted, true);
  assert.equal(screen.api.status.calls.length, 3);
  screen.api.status.calls[2].resolve(snapshot('COMPLETED'));
  await pending;
  await oldRead;
  screen.api.status.calls[1].resolve(paused());
  await screen.runner.flush();
  assert.equal(screen.result.phase, 'completed');
});

test('changing the document cancels its in-flight status signal and ignores its completion', async () => {
  const screen = setup();
  screen.api.upload.calls[0].resolve({ newsletterId: 1, status: 'PENDING' });
  await screen.runner.flush();
  const signal = screen.api.status.calls[0].args[1];
  screen.open({ photoUris: ['second.jpg'] });
  assert.equal(signal.aborted, true);
  screen.api.status.calls[0].resolve(snapshot('COMPLETED'));
  await screen.runner.flush();
  assert.equal(screen.result.status, undefined);
  assert.equal(screen.result.newsletterId, null);
  assert.equal(screen.result.phase, 'starting');
});

const relatedQuery = (screen) => {
  const api = queuedApi();
  screen.runtime.observe({
    ...screen.runtime
      .load('src/query/options.ts')
      .serverOptions(screen.runtime.scope(), 'summary', [1], api.request),
    initialData: { old: true },
    staleTime: Infinity,
  });
  return api;
};

test('production upload mutation waits for related cache refresh across blur and focus without sending twice', async () => {
  const screen = setup(undefined, { realHooks: true });
  await waitFor(screen, () => screen.api.upload.calls.length === 1);
  const related = relatedQuery(screen);
  screen.api.upload.calls[0].resolve({ newsletterId: 1, status: 'PENDING' });
  await waitFor(screen, () => related.calls.length === 1);
  assert.equal(screen.result.phase, 'starting');
  assert.equal(screen.result.newsletterId, null);
  assert.equal(screen.api.status.calls.length, 0);
  screen.runner.blur();
  screen.runner.focus();
  await screen.runner.flush();
  assert.equal(screen.api.upload.calls.length, 1);
  related.calls[0].resolve({ refreshed: true });
  await waitFor(screen, () => screen.api.status.calls.length === 1);
  screen.api.status.calls[0].resolve(snapshot('PROCESSING'));
  await waitFor(screen, () => screen.result.phase === 'processing');
  assert.equal(screen.api.upload.calls.length, 1);
});

test('production command mutation holds its lock until invalidation and the fresh status read finish', async () => {
  const screen = setup(undefined, { realHooks: true });
  await start(screen);
  const related = relatedQuery(screen);
  const pending = screen.result.retry();
  await waitFor(screen, () => screen.api.resume.calls.length === 1);
  screen.api.resume.calls[0].resolve({ newsletterId: 1, status: 'PROCESSING' });
  await waitFor(screen, () => related.calls.length === 1);
  assert.equal(screen.result.action, 'retry');
  assert.equal(screen.api.status.calls.length, 1);
  await screen.result.skipPage();
  await screen.result.retry();
  assert.equal(screen.api.resume.calls.length, 1);
  assert.equal(screen.api.skip.calls.length, 0);
  related.calls[0].resolve({ refreshed: true });
  await waitFor(screen, () => screen.api.status.calls.length === 2);
  assert.equal(screen.result.action, 'retry');
  screen.api.status.calls[1].resolve(snapshot('PROCESSING'));
  await pending;
  await screen.runner.flush();
  assert.equal(screen.result.phase, 'processing');
  assert.equal(screen.result.action, null);
});

['success', 'failure'].forEach((outcome) => {
  test(`production mutation ${outcome} after a document change cannot apply its delayed reconciliation`, async () => {
    const screen = setup(undefined, { realHooks: true });
    await start(screen);
    const related = relatedQuery(screen);
    const { retry } = screen.result;
    const pending = retry();
    await waitFor(screen, () => screen.api.resume.calls.length === 1);
    if (outcome === 'success')
      screen.api.resume.calls[0].resolve({ newsletterId: 1, status: 'PROCESSING' });
    else screen.api.resume.calls[0].reject(new Error('Old failure'));
    await waitFor(screen, () => related.calls.length === 1);
    assert.equal(screen.result.error, null);
    screen.open({ photoUris: ['second.jpg'], childId: 2 });
    await waitFor(screen, () => screen.api.upload.calls.length === 2);
    related.calls[0].resolve({ refreshed: true });
    await pending;
    await retry();
    await screen.runner.flush();
    assert.equal(screen.result.newsletterId, null);
    assert.equal(screen.result.status, undefined);
    assert.equal(screen.result.phase, 'starting');
    assert.equal(screen.result.action, null);
    assert.equal(screen.result.error, null);
    assert.equal(screen.api.resume.calls.length, 1);
    assert.equal(screen.api.status.calls.length, 1);
  });

  test(`returning during production mutation ${outcome} waits for reconciliation and ignores the old callback`, async () => {
    const screen = setup(undefined, { realHooks: true });
    await start(screen);
    const related = relatedQuery(screen);
    const pending = screen.result.retry();
    await waitFor(screen, () => screen.api.resume.calls.length === 1);
    if (outcome === 'success')
      screen.api.resume.calls[0].resolve({ newsletterId: 1, status: 'PROCESSING' });
    else screen.api.resume.calls[0].reject(new Error('Old failure'));
    await waitFor(screen, () => related.calls.length === 1);
    screen.runner.blur();
    screen.runner.focus();
    await screen.runner.flush();
    assert.equal(screen.result.action, 'retry');
    await screen.result.skipPage();
    assert.equal(screen.api.skip.calls.length, 0);
    related.calls[0].resolve({ refreshed: true });
    await pending;
    await waitFor(screen, () => screen.api.status.calls.length >= 3);
    const current = screen.api.status.calls[screen.api.status.calls.length - 1];
    assert.equal(screen.result.action, 'retry');
    current.resolve(outcome === 'success' ? snapshot('PROCESSING') : paused());
    await waitFor(screen, () => screen.result.action === null);
    assert.equal(screen.result.error, null);
    assert.equal(screen.result.phase, outcome === 'success' ? 'processing' : 'paused');
    assert.equal(screen.api.resume.calls.length, 1);
    assert.equal(screen.api.upload.calls.length, 1);
  });
});

test('session change during production mutation reconciliation suppresses old errors and cache writes', async () => {
  const screen = setup(undefined, { realHooks: true });
  await start(screen);
  const related = relatedQuery(screen);
  const pending = screen.result.retry();
  await waitFor(screen, () => screen.api.resume.calls.length === 1);
  screen.api.resume.calls[0].resolve({ newsletterId: 1, status: 'PROCESSING' });
  await waitFor(screen, () => related.calls.length === 1);
  screen.runtime.session.invalidateSession();
  const key = screen.runtime.key('summary', 1);
  screen.runtime.client.setQueryData(key, { currentSession: true });
  await pending;
  related.calls[0].resolve({ oldSession: true });
  await screen.runner.flush();
  assert.equal(screen.result.phase, 'idle');
  assert.equal(screen.result.error, null);
  assert.equal(screen.api.status.calls.length, 1);
  assert.equal(screen.runtime.client.getQueryData(key).currentSession, true);
});

test('automatic retries and processing buttons share transient error classification', () => {
  const screen = setup();
  const { isTransientQueryError: classify } = screen.runtime.load('src/query/state.ts');
  const { retry } = screen.runtime.defaults.queries;
  [
    [new Error('Offline'), true],
    [Object.assign(new Error('Request timeout'), { status: 408 }), true],
    [Object.assign(new Error('Rate limited'), { status: 429 }), true],
    [Object.assign(new Error('Unavailable'), { code: 'NL5031' }), true],
    [new axios.AxiosError('Unavailable', undefined, undefined, undefined, { status: 503 }), true],
    [Object.assign(new Error('Forbidden'), { status: 403 }), false],
    [Object.assign(new Error('Invalid'), { code: 'NL4002' }), false],
    [Object.assign(new Error('Logged out'), { status: 503, code: 'UNAUTHORIZED' }), false],
    [new axios.CanceledError('Cancelled'), false],
  ].forEach(([error, expected]) => {
    assert.equal(classify(error), expected);
    assert.equal(retry(0, error), expected);
    assert.equal(retry(2, error), false);
  });
});

[403, 503].forEach((httpStatus) => {
  test(`automatic retries of status HTTP ${httpStatus} obey the shared bounded policy`, async () => {
    const screen = setup(undefined, { automaticRetry: true });
    screen.api.upload.calls[0].resolve({ newsletterId: 1, status: 'PENDING' });
    await screen.runner.flush();
    const count = httpStatus === 503 ? 3 : 1;
    const failNext = async (index) => {
      assert.equal(screen.api.status.calls.length, index + 1);
      screen.api.status.calls[index].reject(
        Object.assign(new Error('Status failed'), { status: httpStatus })
      );
      await waitFor(screen, () =>
        index + 1 < count
          ? screen.api.status.calls.length === index + 2
          : screen.result.phase === 'error'
      );
      if (index + 1 < count) await failNext(index + 1);
    };
    await failNext(0);
    assert.equal(screen.result.phase, 'error');
    assert.equal(screen.api.status.calls.length, count);
    assert.equal(screen.interval(), false);
  });
});

const animationHarness = () => {
  const animations = [];
  class Value {
    constructor(value) {
      this.value = value;
    }

    setValue(value) {
      this.value = value;
    }

    interpolate() {
      return this.value;
    }
  }
  const animation = () => {
    const entry = {
      stopped: false,
      start(callback) {
        this.callback = callback;
      },
      stop() {
        this.stopped = true;
      },
    };
    animations.push(entry);
    return entry;
  };
  const runner = hookHarness('src/hooks/scan/useNewsletterProcessingAnimation.ts', {
    'react-native': {
      Animated: {
        Value,
        timing: animation,
        spring: animation,
        parallel: animation,
        sequence: animation,
        delay: animation,
        loop: animation,
      },
    },
  });
  cleanups.push(runner.unmount);
  return { runner, animations };
};

test('scan animation stops when paused and restarts when processing resumes', () => {
  const { runner, animations } = animationHarness();
  runner.render('first', 'processing', 30, 300);
  const scan = animations[1];
  assert.equal(scan.stopped, false);
  runner.render('first', 'paused', 30, 300);
  assert.equal(scan.stopped, true);
  runner.render('first', 'processing', 30, 300);
  const resumed = animations[animations.length - 1];
  assert.equal(resumed.stopped, false);
  runner.unmount();
  assert.equal(resumed.stopped, true);
});

test('a stopped completion animation cannot start a glow loop after switching documents', () => {
  const { runner, animations } = animationHarness();
  runner.render('first', 'completed', 100, 300);
  const complete = animations[animations.length - 1];
  runner.result.frameOpacity.setValue(1);
  runner.render('second', 'processing', 0, 300);
  assert.equal(complete.stopped, true);
  assert.equal(runner.result.frameOpacity.value, 0);
  assert.equal(runner.result.checkmarkScale.value, 0);
  const before = animations.length;
  complete.callback({ finished: true });
  assert.equal(animations.length, before);
});
