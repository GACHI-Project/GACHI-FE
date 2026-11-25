/* eslint-env node */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const tanstack = require('@tanstack/react-query');
const axios = require('axios');
const { queuedApi } = require('./hookHarness.cjs');

const flush = () =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

const queryRuntime = (overrides = {}) => {
  const calls = Object.fromEntries(
    [
      'newsletters',
      'daily',
      'weekly',
      'toggle',
      'remove',
      'deleteEvent',
      'pages',
      'count',
      'read',
      'readAll',
    ].map((name) => [name, queuedApi()])
  );
  const transports = {
    newsletter: { fetchNewsletters: calls.newsletters.request },
    calendar: { deleteCalendarEvent: calls.deleteEvent.request },
    checklist: {
      toggleChecklistItem: calls.toggle.request,
      deleteChecklistItem: calls.remove.request,
    },
    notifications: {
      fetchNotifications: calls.pages.request,
      fetchUnreadCount: calls.count.request,
      markNotificationRead: calls.read.request,
      markAllNotificationsRead: calls.readAll.request,
    },
    ...overrides,
  };
  const cache = new Map();
  const load = (file) => {
    const filename = path.resolve(__dirname, '../..', file);
    if (cache.has(filename)) return cache.get(filename);
    const api = /[/\\]api[/\\](\w+)\.ts$/.exec(filename)?.[1];
    if (api && transports[api]) return transports[api];
    if (/[/\\]i18n(?:[/\\]index)?\.ts$/.test(filename)) return { default: { language: 'ko' } };
    const exports = {};
    cache.set(filename, exports);
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    });
    vm.runInNewContext(
      outputText,
      {
        exports,
        AbortController,
        setTimeout,
        clearTimeout,
        require: (name) => {
          if (name === 'axios') return axios;
          if (name === '@tanstack/react-query') return tanstack;
          if (name.startsWith('.')) {
            const resolved = path.resolve(path.dirname(filename), name);
            return load(
              fs.existsSync(`${resolved}.ts`) ? `${resolved}.ts` : `${resolved}/index.ts`
            );
          }
          throw new Error(`Unexpected module: ${name}`);
        },
      },
      { filename }
    );
    return exports;
  };
  const clientModule = load('src/query/client.ts');
  const client = clientModule.queryClient;
  const defaults = client.getDefaultOptions();
  client.setDefaultOptions({
    queries: { retry: false, gcTime: Infinity, staleTime: 0 },
    mutations: { retry: false, gcTime: Infinity, networkMode: 'always' },
  });
  const session = load('src/utils/authSession.ts');
  const observers = new Set();
  const observe = (options, infinite = false) => {
    const observer = new (infinite ? tanstack.InfiniteQueryObserver : tanstack.QueryObserver)(
      client,
      options
    );
    const unsubscribe = observer.subscribe(() => {});
    observers.add(unsubscribe);
    return {
      observer,
      get result() {
        return observer.getCurrentResult();
      },
      dispose: () => {
        unsubscribe();
        observers.delete(unsubscribe);
      },
      setOptions: (next) => observer.setOptions(next),
    };
  };
  const scope = (language = 'ko') => ({ version: session.getSessionVersion(), language });
  return {
    calls,
    defaults,
    load,
    client,
    session,
    observe,
    scope,
    key: (domain, ...params) =>
      clientModule.resourceKey(session.getSessionVersion(), 'ko', domain, ...params),
    flush,
    dispose: () => {
      observers.forEach((unsubscribe) => unsubscribe());
      observers.clear();
      client.clear();
    },
  };
};

module.exports = { queryRuntime, flush };
