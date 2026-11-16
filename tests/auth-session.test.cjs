/* eslint-env node */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const axios = require('axios');
const ts = require('typescript');
const zustand = require('zustand');
const { hookHarness, queuedApi } = require('./helpers/hookHarness.cjs');

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};
const flush = () =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });
const tokens = { accessToken: 'old-access', refreshToken: 'old-refresh' };
const refreshed = { accessToken: 'new-access', refreshToken: 'new-refresh' };
const success = (config, data = {}) => ({
  config,
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
});
const unauthorized = (config) => {
  throw new axios.AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
    ...success(config, { code: 'AUTH4011' }),
    status: 401,
  });
};

const setup = (options = {}) => {
  const values = new Map(Object.entries(tokens));
  const deletions = [];
  const navigations = [];
  const refreshCalls = [];
  let googleSignOutCalls = 0;
  const requests = [];
  const storage = {
    getItemAsync: async (key) =>
      options.getItem ? options.getItem(key, values) : (values.get(key) ?? null),
    setItemAsync: async (key, value) => {
      if (options.beforeWrite) await options.beforeWrite(key, value);
      values.set(key, value);
    },
    deleteItemAsync: async (key) => {
      deletions.push(key);
      if (options.beforeDelete) await options.beforeDelete(key, deletions);
      if (options.failDelete === key) throw new Error('Storage deletion failed');
      values.delete(key);
    },
  };
  const http = {
    ...axios,
    create: (config) =>
      axios.create({
        ...config,
        adapter: async (request) => {
          requests.push(request);
          return options.adapter ? options.adapter(request) : unauthorized(request);
        },
      }),
    post: async (...args) => {
      refreshCalls.push(args);
      return options.refresh ? options.refresh(...args) : { data: { result: refreshed } };
    },
  };
  const cache = new Map();
  const load = (file) => {
    const filename = path.resolve(__dirname, '..', file);
    if (cache.has(filename)) return cache.get(filename);
    const exports = {};
    cache.set(filename, exports);
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    });
    vm.runInNewContext(
      outputText,
      {
        exports,
        AbortController,
        require: (name) => {
          if (name === 'axios') return http;
          if (name === '@react-native-google-signin/google-signin') {
            return {
              GoogleSignin: {
                signOut: () => {
                  googleSignOutCalls += 1;
                  return options.signOut ? options.signOut() : Promise.resolve();
                },
              },
            };
          }
          if (name === 'expo-secure-store') return storage;
          if (name === 'expo-router')
            return { router: { replace: (route) => navigations.push(route) } };
          if (name.startsWith('.')) return load(`${path.resolve(path.dirname(filename), name)}.ts`);
          if (name === 'zustand') return zustand;
          throw new Error(`Unexpected module: ${name}`);
        },
      },
      { filename }
    );
    return exports;
  };
  const auth = load('src/api/auth.ts');
  const session = load('src/utils/authSession.ts');
  const user = load('src/store/userStore.ts').useUserStore;
  const children = load('src/store/childrenStore.ts').useChildrenStore;
  const notifications = load('src/store/notificationStore.ts').useNotificationStore;
  const registration = load('src/store/registerStore.ts').useRegisterStore;
  const kakao = load('src/store/kakaoAuthStore.ts').useKakaoAuthStore;
  const google = load('src/store/googleAuthStore.ts').useGoogleAuthStore;
  const request = () =>
    auth.apiClient.get('/private', { headers: { Authorization: 'Bearer old-access' } });
  return {
    auth,
    session,
    load,
    user,
    children,
    notifications,
    registration,
    kakao,
    google,
    getGoogleSignOutCalls: () => googleSignOutCalls,
    values,
    deletions,
    navigations,
    refreshCalls,
    requests,
    request,
  };
};

const assertAllRejected = (results) => {
  results.forEach((result) => assert.equal(result.status, 'rejected'));
};

test('concurrent 401 requests all reject when the refresh token is missing', async () => {
  const read = deferred();
  const app = setup({ getItem: () => read.promise });
  const pending = Promise.allSettled([app.request(), app.request(), app.request()]);
  await flush();
  read.resolve(null);
  assertAllRejected(await pending);
  assert.equal(app.refreshCalls.length, 0);
  assert.equal(app.navigations.length, 1);
  assert.equal(app.values.size, 0);
});

test('a SecureStore read failure settles every refresh waiter', async () => {
  const read = deferred();
  const app = setup({ getItem: () => read.promise });
  const pending = Promise.allSettled([app.request(), app.request()]);
  await flush();
  read.reject(new Error('SecureStore unavailable'));
  assertAllRejected(await pending);
  assert.equal(app.navigations.length, 1);
});

test('concurrent requests share one refresh and retry with the new access token', async () => {
  const refresh = deferred();
  const app = setup({
    refresh: () => refresh.promise,
    adapter: (config) =>
      config.headers.Authorization === 'Bearer new-access'
        ? success(config, { ok: true })
        : unauthorized(config),
  });
  const pending = Promise.all([app.request(), app.request(), app.request()]);
  await flush();
  assert.equal(app.refreshCalls.length, 1);
  assert.equal(app.refreshCalls[0][2].timeout, 10000);
  refresh.resolve({ data: { result: refreshed } });
  const responses = await pending;
  assert.equal(responses.length, 3);
  assert.equal(app.requests.length, 6);
  assert.equal(app.values.get('accessToken'), refreshed.accessToken);
  assert.equal(app.values.get('refreshToken'), refreshed.refreshToken);
  assert.equal(app.navigations.length, 0);
});

['ERR_BAD_REQUEST', 'ECONNABORTED'].forEach((code) => {
  test(`refresh failure (${code}) settles all requests and clears the session once`, async () => {
    const refresh = deferred();
    const app = setup({ refresh: () => refresh.promise });
    const pending = Promise.allSettled([app.request(), app.request()]);
    await flush();
    refresh.reject(new axios.AxiosError('Refresh failed', code));
    assertAllRejected(await pending);
    assert.equal(app.refreshCalls.length, 1);
    assert.equal(app.navigations.length, 1);
    assert.equal(app.values.size, 0);
  });
});

test('a public login 401 preserves the original error without attempting refresh', async () => {
  const app = setup();
  await assert.rejects(
    app.auth.login('wrong', 'password', false),
    (error) => error.code === 'AUTH4011'
  );
  assert.equal(app.refreshCalls.length, 0);
  assert.equal(app.navigations.length, 0);
  assert.equal(app.values.get('refreshToken'), tokens.refreshToken);
});

test('clearSession resets all account stores even if one token deletion fails', async () => {
  const app = setup({ failDelete: 'accessToken' });
  app.user.getState().setName('Previous user');
  app.children.getState().setChildren([{ id: 1, name: 'Previous child' }]);
  app.notifications.getState().setUnreadCount(5);
  app.registration.getState().setSignupToken('previous-signup');
  app.kakao.getState().setRememberMe(true);
  app.google.getState().setRememberMe(true);
  const first = app.auth.clearSession();
  const second = app.auth.clearSession();
  assert.equal(first, second);
  const cleanup = await first;
  assert.equal(cleanup.success, false);
  assert.deepEqual(Array.from(cleanup.failedTokenKeys), ['accessToken']);
  assert.equal(app.user.getState().name, '');
  assert.equal(app.children.getState().children.length, 0);
  assert.equal(app.notifications.getState().unreadCount, 0);
  assert.equal(app.registration.getState().signupToken, '');
  assert.equal(app.kakao.getState().rememberMe, false);
  assert.equal(app.google.getState().rememberMe, false);
  assert.equal(app.getGoogleSignOutCalls(), 1);
  assert.deepEqual(app.deletions.sort(), ['accessToken', 'accessToken', 'refreshToken']);
  assert.equal(app.navigations.length, 1);
});

test('a late response from the previous session is rejected before updating stores', async () => {
  const response = deferred();
  const app = setup({ adapter: async (config) => success(config, await response.promise) });
  const result = Promise.allSettled([
    app.request().then((value) => app.children.getState().setChildren(value.data)),
  ]);
  await flush();
  await app.auth.clearSession();
  response.resolve([{ id: 1, name: 'Previous child' }]);
  assertAllRejected(await result);
  assert.equal(app.children.getState().children.length, 0);
});

test('callbacks captured before session cleanup cannot restore account state', async () => {
  const app = setup();
  const update = app.session.withCurrentSession(app.notifications.getState().setUnreadCount);
  update(5);
  await app.auth.clearSession();
  update(5);
  assert.equal(app.notifications.getState().unreadCount, 0);
  app.session.withCurrentSession(app.notifications.getState().setUnreadCount)(2);
  assert.equal(app.notifications.getState().unreadCount, 2);
});

test('a delayed refresh cannot overwrite tokens or clear a newer session', async () => {
  const refresh = deferred();
  const app = setup({ refresh: () => refresh.promise });
  const pending = Promise.allSettled([app.request(), app.request()]);
  await flush();
  const { signal } = app.refreshCalls[0][2];
  await app.auth.clearSession();
  assert.equal(signal.aborted, true);
  const nextTokens = { accessToken: 'next-user-access', refreshToken: 'next-user-refresh' };
  await app.auth.saveAuthTokens(nextTokens, app.session.getSessionVersion());
  // Simulate a transport delivering its response despite cancellation.
  refresh.resolve({ data: { result: refreshed } });
  assertAllRejected(await pending);
  assert.equal(app.values.get('accessToken'), nextTokens.accessToken);
  assert.equal(app.values.get('refreshToken'), nextTokens.refreshToken);
  assert.equal(app.navigations.length, 1);
});

test('cleanup waits for an in-progress token write before deleting both tokens', async () => {
  const write = deferred();
  const app = setup({ beforeWrite: () => write.promise });
  const pending = Promise.allSettled([app.request(), app.request()]);
  await flush();
  const cleanup = app.auth.clearSession();
  assert.equal(app.deletions.length, 0);
  write.resolve();
  await cleanup;
  assertAllRejected(await pending);
  assert.equal(app.values.size, 0);
  assert.equal(app.navigations.length, 1);
});

test('a delayed logout completion cannot clear a newer session', async () => {
  const response = deferred();
  const app = setup({ adapter: async (config) => success(config, await response.promise) });
  const logout = app.auth.logout();
  await flush();
  await app.auth.clearSession();
  await app.auth.saveAuthTokens(refreshed, app.session.getSessionVersion());
  response.resolve({});
  await logout;
  assert.equal(app.values.get('accessToken'), refreshed.accessToken);
  assert.equal(app.navigations.length, 1);
});

['synchronous', 'asynchronous'].forEach((failure) => {
  test(`Google SDK ${failure} sign-out failure does not prevent session cleanup`, async () => {
    const app = setup({
      signOut: () => {
        if (failure === 'synchronous') throw new Error('SDK unavailable');
        return Promise.reject(new Error('SDK sign-out failed'));
      },
    });
    await app.auth.clearSession();
    await flush();
    assert.equal(app.getGoogleSignOutCalls(), 1);
    assert.equal(app.values.size, 0);
    assert.equal(app.navigations.length, 1);
  });
});

const childPayload = {
  name: 'Previous child',
  schoolName: 'School',
  schoolCode: 'school',
  officeCode: 'office',
  grade: 1,
  colorCode: '#ffffff',
  className: '1',
};

const authenticatedOperations = [
  ['child registration', 'src/api/child.ts', (api) => api.registerChild(childPayload)],
  ['child batch registration', 'src/api/child.ts', (api) => api.registerChildren([childPayload])],
  ['child update', 'src/api/child.ts', (api) => api.updateChild(1, childPayload)],
  ['child deletion', 'src/api/child.ts', (api) => api.deleteChild(1)],
  ['calendar update', 'src/api/calendar.ts', (api) => api.completeChecklist(1, true)],
  [
    'chat message',
    'src/api/chat.ts',
    (api) => api.sendChatMessage({ sessionId: null, message: 'old' }),
  ],
  ['checklist update', 'src/api/checklist.ts', (api) => api.toggleChecklistItem(1, true)],
  ['newsletter detail', 'src/api/newsletter.ts', (api) => api.getNewsletterDetail(1)],
  ['notification read', 'src/api/notifications.ts', (api) => api.markNotificationRead(1)],
  ['school guide lookup', 'src/api/schoolGuide.ts', (api) => api.getSchoolGuideCategories()],
  ['account withdrawal', 'src/api/user.ts', (api) => api.withdrawUser('password')],
];

authenticatedOperations.forEach(([name, filename, operation]) => {
  test(`${name} cannot switch accounts during token lookup`, async () => {
    const read = deferred();
    const app = setup({ getItem: () => read.promise });
    const pending = Promise.allSettled([operation(app.load(filename))]);
    await flush();
    await app.auth.clearSession();
    await app.auth.saveAuthTokens(refreshed, app.session.getSessionVersion());
    read.resolve(refreshed.accessToken);
    assertAllRejected(await pending);
    assert.equal(app.requests.length, 0);
    assert.equal(app.refreshCalls.length, 0);
    assert.equal(app.values.get('accessToken'), refreshed.accessToken);
    assert.equal(app.navigations.length, 1);
  });
});

test('a stale signup session is rejected before child token lookup', async () => {
  let reads = 0;
  const app = setup({
    getItem: () => {
      reads += 1;
      return refreshed.accessToken;
    },
  });
  const version = app.session.getSessionVersion();
  await app.auth.clearSession();
  await app.auth.saveAuthTokens(refreshed, app.session.getSessionVersion());
  await assert.rejects(app.load('src/api/child.ts').registerChild(childPayload, version));
  assert.equal(reads, 0);
  assert.equal(app.requests.length, 0);
});

test('request dispatch preserves the session captured before token lookup', async () => {
  const app = setup();
  const config = await app.auth.getAuthRequestConfig(() => new Error('Unauthorized'));
  await app.auth.clearSession();
  await app.auth.saveAuthTokens(refreshed, app.session.getSessionVersion());
  await assert.rejects(app.auth.apiClient.post('/api/v1/children', childPayload, config));
  assert.equal(app.requests.length, 0);
  assert.equal(app.refreshCalls.length, 0);
});

['accessToken', 'refreshToken'].forEach((blockedKey) => {
  test(`logout cannot switch accounts while reading ${blockedKey}`, async () => {
    const read = deferred();
    const app = setup({
      getItem: (key, values) => (key === blockedKey ? read.promise : values.get(key)),
    });
    const pending = app.auth.logout();
    await flush();
    await app.auth.clearSession();
    await app.auth.saveAuthTokens(refreshed, app.session.getSessionVersion());
    read.resolve(refreshed[blockedKey]);
    await pending;
    assert.equal(app.requests.length, 0);
    assert.equal(app.values.get('accessToken'), refreshed.accessToken);
    assert.equal(app.navigations.length, 1);
  });
});

test('cleanup retries only the token that failed and reports successful recovery', async () => {
  const app = setup({
    beforeDelete: (key, attempts) => {
      if (key === 'accessToken' && attempts.filter((value) => value === key).length === 1) {
        throw new Error('Temporary storage error');
      }
    },
  });
  const result = await app.auth.clearSession();
  assert.equal(result.success, true);
  assert.equal(result.failedTokenKeys.length, 0);
  assert.equal(app.deletions.filter((key) => key === 'accessToken').length, 2);
  assert.equal(app.deletions.filter((key) => key === 'refreshToken').length, 1);
  assert.equal(app.values.size, 0);
  assert.equal(app.navigations.length, 1);
});

test('logout reports permanent deletion failures and blocks leftover credentials', async () => {
  const app = setup({
    failDelete: 'accessToken',
    adapter: (config) => success(config, { result: {} }),
  });
  const result = await app.auth.logout();
  assert.equal(result.success, false);
  assert.deepEqual(Array.from(result.failedTokenKeys), ['accessToken']);
  assert.equal(app.values.get('accessToken'), tokens.accessToken);
  await assert.rejects(app.load('src/api/child.ts').registerChild(childPayload));
  await assert.rejects(app.request());
  assert.equal(app.requests.length, 1);
  assert.equal(app.refreshCalls.length, 0);
  await app.auth.saveAuthTokens(refreshed, app.session.getSessionVersion());
  await app.load('src/api/child.ts').registerChild(childPayload);
  assert.equal(app.requests.length, 2);
  assert.equal(app.requests[1].headers.Authorization, `Bearer ${refreshed.accessToken}`);
});

const notificationSetup = async () => {
  const app = setup();
  const fetch = queuedApi();
  const children = queuedApi();
  const read = queuedApi();
  const readAll = queuedApi();
  const runner = hookHarness('src/hooks/notifications/useNotificationList.ts', {
    '../../api/notifications': {
      fetchNotifications: fetch.request,
      markNotificationRead: read.request,
      markAllNotificationsRead: readAll.request,
    },
    '../../api/calendar': { fetchChildren: children.request },
    '../../store/notificationStore': {
      useNotificationStore: () => ({ setUnreadCount: app.notifications.getState().setUnreadCount }),
    },
    '../../utils/authSession': app.session,
  });
  const page = (id, isRead = false) => ({
    notifications: [{ id, read: isRead }],
    nextCursor: id,
    hasNext: true,
  });
  runner.render();
  fetch.calls[0].resolve(page(1));
  children.calls[0].resolve([]);
  await runner.flush();
  const loadNewSession = async (id, isRead = false) => {
    await app.auth.clearSession();
    await app.auth.saveAuthTokens(refreshed, app.session.getSessionVersion());
    runner.result.loadInitial();
    fetch.calls[fetch.calls.length - 1].resolve(page(id, isRead));
    children.calls[children.calls.length - 1].resolve([]);
    await runner.flush();
  };
  return { app, runner, fetch, children, read, readAll, page, loadNewSession };
};

test('old notification initialization cannot overwrite the next session list', async () => {
  const state = await notificationSetup();
  state.runner.result.loadInitial();
  await state.loadNewSession(2);
  state.fetch.calls[1].resolve(state.page(1));
  state.children.calls[1].resolve([]);
  await state.runner.flush();
  assert.deepEqual(
    Array.from(state.runner.result.notifications, (item) => item.id),
    [2]
  );
});

test('old notification pagination cannot append to the next session list', async () => {
  const state = await notificationSetup();
  const more = state.runner.result.loadMore();
  await state.loadNewSession(2);
  state.fetch.calls[1].resolve(state.page(99));
  await more;
  await state.runner.flush();
  assert.deepEqual(
    Array.from(state.runner.result.notifications, (item) => item.id),
    [2]
  );
});

test('old single-read rollback cannot undo a newer session read state', async () => {
  const state = await notificationSetup();
  state.runner.result.markAsRead(1);
  await state.loadNewSession(1, true);
  state.read.calls[0].reject(new Error('Previous session request failed'));
  await state.runner.flush();
  assert.equal(state.runner.result.notifications[0].read, true);
  assert.equal(state.app.notifications.getState().unreadCount, 0);
});

test('old read-all rollback cannot restore a previous session snapshot', async () => {
  const state = await notificationSetup();
  state.runner.result.handleMarkAllRead();
  await state.loadNewSession(2);
  state.readAll.calls[0].reject(new Error('Previous session request failed'));
  await state.runner.flush();
  assert.deepEqual(
    Array.from(state.runner.result.notifications, (item) => item.id),
    [2]
  );
  assert.equal(state.app.notifications.getState().unreadCount, 1);
});

// Isolate the actual screen callback without loading native UI modules.
const loadScreenCallback = (file, name, globals) => {
  const filename = path.resolve(__dirname, '..', file);
  const source = ts.createSourceFile(
    filename,
    fs.readFileSync(filename, 'utf8'),
    ts.ScriptTarget.ES2020,
    true,
    ts.ScriptKind.TSX
  );
  let initializer;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name) {
      initializer = node.initializer;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  assert.ok(initializer, `${name} must exist in ${file}`);
  const { outputText } = ts.transpileModule(`exports.callback = ${initializer.getText(source)};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  });
  const exports = {};
  vm.runInNewContext(outputText, { exports, ...globals }, { filename });
  return exports.callback;
};

[
  ['normal and Google login', 'app/(auth)/login.tsx', 'finishLogin'],
  ['Kakao login', 'app/(auth)/kakao-auth.tsx', 'complete'],
].forEach(([name, filename, callbackName]) => {
  test(`${name} cannot change the next session language after a delayed save`, async () => {
    const app = setup();
    const savedLanguage = deferred();
    const languages = [];
    const routes = [];
    let saves = 0;
    const callback = loadScreenCallback(filename, callbackName, {
      ...app.session,
      AuthApiError: app.auth.AuthApiError,
      saveAuthTokens: app.auth.saveAuthTokens,
      ticket: 'old-ticket',
      useKakaoAuthStore: app.kakao,
      completeKakaoLogin: async () => ({ status: 'LOGIN_SUCCESS', tokens }),
      getMe: async () => ({ name: 'Previous user', languageCode: 'VI' }),
      setName: app.user.getState().setName,
      fromServerLanguageCode: () => 'vi',
      SUPPORTED_LANGUAGES: ['ko', 'vi'],
      saveLanguage: () => {
        saves += 1;
        return savedLanguage.promise;
      },
      i18n: {
        changeLanguage: async (language) => {
          languages.push(language);
        },
      },
      router: {
        replace: (route) => {
          routes.push(route);
        },
      },
      registerDevicePushToken: async () => {},
      replaceToLoginWithError: () => {},
    });
    const pending = Promise.allSettled([callback(tokens, app.session.getSessionVersion())]);
    await flush();
    assert.equal(saves, 1);
    await app.auth.clearSession();
    await app.auth.saveAuthTokens(refreshed, app.session.getSessionVersion());
    languages.push('ko');
    savedLanguage.resolve();
    await pending;
    assert.deepEqual(languages, ['ko']);
    assert.equal(routes.length, 0);
  });
});

test('an old non-401 error is cancelled instead of triggering another account workflow', async () => {
  const response = deferred();
  const app = setup({
    adapter: async (config) => {
      await response.promise;
      throw new axios.AxiosError('Expired workflow', 'ERR_BAD_REQUEST', config, undefined, {
        ...success(config, { code: 'CHAT4003' }),
        status: 400,
      });
    },
  });
  const pending = Promise.allSettled([app.request()]);
  await flush();
  await app.auth.clearSession();
  await app.auth.saveAuthTokens(refreshed, app.session.getSessionVersion());
  response.resolve();
  const [result] = await pending;
  assert.equal(result.status, 'rejected');
  assert.equal(axios.isCancel(result.reason), true);
  assert.equal(app.refreshCalls.length, 0);
  assert.equal(app.values.get('accessToken'), refreshed.accessToken);
});
