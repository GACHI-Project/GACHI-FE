/* eslint-env node */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const axios = require('axios');
const ts = require('typescript');
const zustand = require('zustand');
const tanstack = require('@tanstack/react-query');
const { hookHarness } = require('./helpers/hookHarness.cjs');

const clients = new Set();
test.afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.clear();
});

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
        process: { env: { EXPO_PUBLIC_API_BASE_URL: options.apiBaseUrl } },
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
          if (name === '@tanstack/react-query') return tanstack;
          throw new Error(`Unexpected module: ${name}`);
        },
      },
      { filename }
    );
    return exports;
  };
  if (options.installEffects !== false) load('src/auth/sessionEffects.ts').installSessionEffects();
  const auth = {
    ...load('src/api/auth.ts'),
    ...load('src/api/client.ts'),
    ...load('src/auth/session.ts'),
    ...load('src/auth/logout.ts'),
  };
  const session = load('src/utils/authSession.ts');
  const client = load('src/query/client.ts').queryClient;
  clients.add(client);
  const key = (domain) => ['session', session.getSessionVersion(), 'ko', domain];
  const user = {
    getState: () => ({
      name: client.getQueryData(key('profile'))?.name ?? '',
      setName: (name) => client.setQueryData(key('profile'), { name }),
    }),
  };
  const children = {
    getState: () => ({
      children: client.getQueryData(key('children')) ?? [],
      setChildren: (items) => client.setQueryData(key('children'), items),
    }),
  };
  const notifications = {
    getState: () => ({
      unreadCount: client.getQueryData(key('unread')) ?? 0,
      setUnreadCount: (count) => client.setQueryData(key('unread'), count),
    }),
  };
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

test('clearSession clears server caches and registration stores even if token deletion fails', async () => {
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
  assert.deepEqual(app.deletions.sort(), [
    'accessToken',
    'accessToken',
    'refreshToken',
    'rememberMe',
  ]);
  assert.equal(app.navigations.length, 1);
});

test('a late response from the previous session is rejected before updating caches', async () => {
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

// Load a module with explicit dependencies so the shared unread counter uses this app's session.
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
  {
    name: 'normal and Google login',
    filename: 'app/(auth)/login.tsx',
    callbackName: 'completeNavigation',
    // completeNavigation(version) no longer saves tokens itself — that now happens
    // in the caller (handleLogin/handleGoogleLogin) before this is invoked.
    invoke: (callback, version) => callback(version),
  },
  {
    name: 'Kakao login',
    filename: 'app/(auth)/kakao-auth.tsx',
    callbackName: 'completeLogin',
    invoke: (callback, version) => callback('old-ticket', false, version),
  },
].forEach(({ name, filename, callbackName, invoke }) => {
  test(`${name} cannot change the next session language after a delayed save`, async () => {
    const app = setup();
    const savedLanguage = deferred();
    const languages = [];
    const routes = [];
    let saves = 0;
    const callback = loadScreenCallback(filename, callbackName, {
      ...app.session,
      fetchSessionResource: async (_domain, _params, fetch) => fetch(),
      getMeApi: async () => ({ name: 'Old', languageCode: 'EN' }),
      AuthApiError: app.auth.AuthApiError,
      saveAuthTokens: app.auth.saveAuthTokens,
      saveRememberMe: async () => {},
      ticket: 'old-ticket',
      useKakaoAuthStore: app.kakao,
      useSocialLinkStore: { getState: () => ({ pendingLink: null }) },
      attemptPendingLink: async () => {},
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
    const pending = Promise.allSettled([invoke(callback, app.session.getSessionVersion())]);
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

test('the configured API origin is shared by normal requests, token refresh and social authorization', async () => {
  const app = setup({
    apiBaseUrl: ' https://staging.example.test/ ',
    adapter: (config) =>
      config.headers.Authorization === 'Bearer new-access' ? success(config) : unauthorized(config),
  });
  await app.request();
  assert.equal(app.auth.apiClient.defaults.baseURL, 'https://staging.example.test');
  assert.equal(app.requests[0].baseURL, 'https://staging.example.test');
  assert.equal(app.refreshCalls[0][0], 'https://staging.example.test/api/v1/auth/reissue');
  assert.equal(
    app.auth.getKakaoAuthorizeUrl(),
    'https://staging.example.test/api/v1/auth/kakao/authorize'
  );
});

test('an unspecified API origin retains the existing server default', () => {
  const app = setup();
  assert.equal(app.auth.apiClient.defaults.baseURL, 'https://43.202.191.103');
});

test('HTTP 401 after a refreshed retry does not start another refresh loop', async () => {
  const app = setup();
  await assert.rejects(app.request());
  assert.equal(app.refreshCalls.length, 1);
  assert.equal(app.requests.length, 2);
});

test('session cleanup works without app navigation or SDK effects installed', async () => {
  const app = setup({ installEffects: false });
  app.registration.getState().setSignupToken('draft');
  app.user.getState().setName('Old account');
  await app.auth.clearSession();
  assert.equal(app.values.size, 0);
  assert.equal(app.user.getState().name, '');
  assert.equal(app.registration.getState().signupToken, 'draft');
  assert.equal(app.navigations.length, 0);
  assert.equal(app.getGoogleSignOutCalls(), 0);
});

test('app cleanup effects are idempotent and an old disposer cannot remove a later installation', async () => {
  const app = setup();
  const effects = app.load('src/auth/sessionEffects.ts');
  const oldDispose = effects.installSessionEffects();
  assert.equal(effects.installSessionEffects(), oldDispose);
  oldDispose();
  const currentDispose = effects.installSessionEffects();
  oldDispose();
  assert.equal(effects.installSessionEffects(), currentDispose);
  await app.auth.clearSession();
  assert.equal(app.navigations.length, 1);
  assert.equal(app.getGoogleSignOutCalls(), 1);
  currentDispose();
  await app.auth.saveAuthTokens(refreshed, app.session.getSessionVersion());
  await app.auth.clearSession();
  assert.equal(app.navigations.length, 1);
});

test('a cleanup callback reentering clearSession shares the same cleanup operation', async () => {
  const app = setup();
  let reentered;
  const unsubscribe = app.auth.subscribeSessionCleanup((phase) => {
    if (phase === 'invalidated') reentered = app.auth.clearSession();
  });
  const pending = app.auth.clearSession();
  assert.equal(pending, reentered);
  await pending;
  assert.equal(app.session.getSessionVersion(), 1);
  assert.equal(app.navigations.length, 1);
  unsubscribe();
});

test('an app cleanup callback failure cannot prevent token deletion or other callbacks', async () => {
  const app = setup();
  const phases = [];
  app.auth.subscribeSessionCleanup(() => {
    throw new Error('App effect failed');
  });
  app.auth.subscribeSessionCleanup((phase) => phases.push(phase));
  const result = await app.auth.clearSession();
  assert.equal(result.success, true);
  assert.equal(app.values.size, 0);
  assert.deepEqual(phases, ['invalidated', 'clearing-tokens', 'cleared']);
  assert.equal(app.navigations.length, 1);
});

const errorOperations = [
  ['src/api/auth.ts', 'AuthApiError', (api) => api.login('user', 'password', false)],
  ['src/api/child.ts', 'ChildApiError', (api) => api.fetchChildren()],
  ['src/api/calendar.ts', 'CalendarApiError', (api) => api.fetchChildren()],
  [
    'src/api/chat.ts',
    'ChatApiError',
    (api) => api.sendChatMessage({ sessionId: null, message: 'Hi' }),
  ],
  ['src/api/checklist.ts', 'ChecklistApiError', (api) => api.getTodayChecklists()],
  ['src/api/meal.ts', 'MealApiError', (api) => api.fetchSchoolMeals('20261126', '20261126')],
  ['src/api/newsletter.ts', 'NewsletterApiError', (api) => api.getNewsletterDetail(1)],
  ['src/api/notifications.ts', 'NotificationApiError', (api) => api.fetchUnreadCount()],
  ['src/api/schoolGuide.ts', 'SchoolGuideApiError', (api) => api.getSchoolGuideCategories()],
  ['src/api/user.ts', 'UserApiError', (api) => api.getMe()],
  ['src/api/school.ts', null, (api) => api.searchSchools('School')],
];

errorOperations.forEach(([filename, errorClass, operation]) => {
  [true, false].forEach((coded) => {
    test(`${filename} preserves HTTP status and domain error type with server code: ${coded}`, async () => {
      const app = setup({
        adapter: (config) => {
          throw new axios.AxiosError('Forbidden', 'ERR_BAD_REQUEST', config, undefined, {
            ...success(
              config,
              coded ? { code: 'DOMAIN4031', message: 'No permission' } : 'Forbidden'
            ),
            status: 403,
          });
        },
      });
      const api = app.load(filename);
      await assert.rejects(operation(api), (error) => {
        const Expected = errorClass ? api[errorClass] : app.load('src/api/errors.ts').ApiError;
        assert.ok(error instanceof Expected);
        assert.equal(error.status, 403);
        assert.equal(error.code, coded ? 'DOMAIN4031' : 'HTTP403');
        assert.equal(error.message, coded ? 'No permission' : '알 수 없는 오류');
        return true;
      });
      assert.equal(app.refreshCalls.length, 0);
    });
  });
});

test('shared error conversion preserves cancellation even when it contains an HTTP response', () => {
  const app = setup();
  const error = new axios.CanceledError('Cancelled');
  error.response = { status: 503, data: { code: 'SERVER5031' } };
  const converted = app.load('src/api/errors.ts').toApiError(error, app.auth.AuthApiError);
  assert.equal(converted, error);
  assert.equal(axios.isCancel(converted), true);
});

test('domain error conversion preserves network and timeout metadata instead of wrapping it', async () => {
  const timeout = new axios.AxiosError('Timeout', 'ECONNABORTED');
  const app = setup({
    adapter: () => {
      throw timeout;
    },
  });
  await assert.rejects(app.load('src/api/child.ts').fetchChildren(), (error) => error === timeout);
});

test('a cancelled domain request retains its cancellation identity', async () => {
  const cancelled = new axios.CanceledError('Cancelled');
  const app = setup({
    adapter: () => {
      throw cancelled;
    },
  });
  await assert.rejects(
    app.load('src/api/newsletter.ts').getNewsletterDetail(1),
    (error) => error === cancelled
  );
});

test('refresh cannot restore a logged-out session using a token whose deletion failed', async () => {
  const app = setup({ failDelete: 'refreshToken' });
  await app.auth.clearSession();
  await assert.rejects(
    app.auth.refreshAccessToken(app.session.getSessionVersion()),
    axios.isCancel
  );
  assert.equal(app.refreshCalls.length, 0);
  assert.equal(app.session.getSessionSnapshot().authenticated, false);
});

test('cancelling one refresh waiter settles it immediately without aborting another waiter', async () => {
  const refresh = deferred();
  const app = setup({
    refresh: () => refresh.promise,
    adapter: (config) =>
      config.headers.Authorization === 'Bearer new-access' ? success(config) : unauthorized(config),
  });
  const controller = new AbortController();
  let cancelledError;
  const cancelled = app.auth.apiClient
    .get('/cancel', {
      headers: { Authorization: 'Bearer old-access' },
      signal: controller.signal,
    })
    .catch((error) => {
      cancelledError = error;
    });
  const current = app.request();
  await flush();
  controller.abort();
  await flush();
  const cancelledBeforeRefresh = axios.isCancel(cancelledError);
  assert.equal(app.refreshCalls[0][2].signal.aborted, false);
  refresh.resolve({ data: { result: refreshed } });
  await Promise.all([cancelled, current]);
  assert.equal(cancelledBeforeRefresh, true);
  assert.equal(app.refreshCalls.length, 1);
  assert.equal(app.requests.filter((request) => request.url === '/cancel').length, 1);
});

test('a late 401 for an old access token reuses the refreshed token without rotating again', async () => {
  const response = deferred();
  const app = setup({
    adapter: async (config) => {
      if (config.headers.Authorization === 'Bearer new-access') return success(config);
      if (config.url === '/slow') await response.promise;
      return unauthorized(config);
    },
  });
  const slow = app.auth.apiClient.get('/slow', { headers: { Authorization: 'Bearer old-access' } });
  await flush();
  await app.request();
  response.resolve();
  await slow;
  assert.equal(app.refreshCalls.length, 1);
  assert.equal(app.navigations.length, 0);
});

test('a remember-me write finishing after logout rejects its obsolete completion', async () => {
  const write = deferred();
  const app = setup({ beforeWrite: (key) => (key === 'rememberMe' ? write.promise : undefined) });
  const pending = Promise.allSettled([
    app.auth.saveRememberMe(true, app.session.getSessionVersion()),
  ]);
  await flush();
  const cleanup = app.auth.clearSession();
  write.resolve();
  const [result] = await pending;
  await cleanup;
  assert.equal(result.status, 'rejected');
  assert.equal(axios.isCancel(result.reason), true);
  assert.equal(app.values.size, 0);
});

test('remember-me lookup rejects when its session changes before storage returns', async () => {
  const read = deferred();
  const app = setup({
    getItem: (key, values) => (key === 'rememberMe' ? read.promise : values.get(key)),
  });
  const pending = Promise.allSettled([app.auth.getRememberMe()]);
  await app.auth.clearSession();
  await app.auth.saveAuthTokens(refreshed, app.session.getSessionVersion());
  read.resolve('true');
  const [result] = await pending;
  assert.equal(result.status, 'rejected');
  assert.equal(axios.isCancel(result.reason), true);
});

test('a failing store reset cannot skip clearing the other authentication stores', async () => {
  const app = setup();
  app.kakao.getState().setRememberMe(true);
  app.google.getState().setRememberMe(true);
  const unsubscribe = app.registration.subscribe(() => {
    throw new Error('Store subscriber failed');
  });
  await app.auth.clearSession();
  unsubscribe();
  assert.equal(app.kakao.getState().rememberMe, false);
  assert.equal(app.google.getState().rememberMe, false);
  assert.equal(app.values.size, 0);
});

['checkLoginId', 'checkPhoneNumber', 'checkEmail'].forEach((operation) => {
  test(`${operation} preserves a cancelled response instead of treating it as a conflict`, async () => {
    const error = new axios.CanceledError('Cancelled');
    const app = setup({
      adapter: (config) => {
        error.config = config;
        error.response = { ...success(config), status: 409 };
        throw error;
      },
    });
    await assert.rejects(app.auth[operation]('value'), (caught) => caught === error);
  });
});

test('an Axios cancellation carrying a 401 does not trigger token refresh', async () => {
  const error = new axios.CanceledError('Cancelled');
  const app = setup({
    adapter: (config) => {
      error.config = config;
      error.response = { ...success(config), status: 401 };
      throw error;
    },
  });
  await assert.rejects(app.request(), (caught) => caught === error);
  assert.equal(app.refreshCalls.length, 0);
  assert.equal(app.navigations.length, 0);
});

const sessionEffectsHook = (app, contentReady = false) => {
  let navigationReady = false;
  const listeners = new Set();
  const navigation = {
    isReady: () => navigationReady,
    addListener: (event, callback) => {
      assert.equal(event, 'ready');
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };
  const runner = hookHarness('src/auth/useSessionEffects.ts', {
    'expo-router': {
      useNavigationContainerRef: () => navigation,
      router: { replace: (route) => app.navigations.push(route) },
    },
    '../utils/authSession': app.session,
    './sessionEffects': app.load('src/auth/sessionEffects.ts'),
  });
  runner.render(contentReady);
  return {
    runner,
    listeners,
    ready: () => {
      navigationReady = true;
      listeners.forEach((notify) => notify());
    },
  };
};

test('startup cleanup waits for content and navigator readiness, then redirects once', async () => {
  const app = setup({ installEffects: false });
  const hook = sessionEffectsHook(app);
  try {
    await app.auth.clearSession();
    await hook.runner.flush();
    assert.equal(app.navigations.length, 0);
    hook.ready();
    await hook.runner.flush();
    assert.equal(app.navigations.length, 0);
    hook.runner.render(true);
    assert.deepEqual(app.navigations, ['/(auth)/login']);
    hook.runner.render(true);
    assert.equal(app.navigations.length, 1);
  } finally {
    hook.runner.unmount();
  }
  assert.equal(hook.listeners.size, 0);
});

test('a delayed navigator ready event releases pending cleanup navigation', async () => {
  const app = setup({ installEffects: false });
  const hook = sessionEffectsHook(app, true);
  try {
    await app.auth.clearSession();
    await hook.runner.flush();
    assert.equal(app.navigations.length, 0);
    hook.ready();
    await hook.runner.flush();
    assert.equal(app.navigations.length, 1);
  } finally {
    hook.runner.unmount();
  }
});

test('a fresh login invalidates an old redirect queued before navigator readiness', async () => {
  const app = setup({ installEffects: false });
  const hook = sessionEffectsHook(app);
  try {
    await app.auth.clearSession();
    await hook.runner.flush();
    await app.auth.saveAuthTokens(refreshed, app.session.getSessionVersion());
    await hook.runner.flush();
    hook.ready();
    hook.runner.render(true);
    assert.equal(app.navigations.length, 0);
  } finally {
    hook.runner.unmount();
  }
});

test('unmounting the app removes navigation and cleanup listeners', async () => {
  const app = setup({ installEffects: false });
  const hook = sessionEffectsHook(app, true);
  hook.runner.unmount();
  assert.equal(hook.listeners.size, 0);
  await app.auth.clearSession();
  assert.equal(app.navigations.length, 0);
  assert.equal(hook.runner.postUnmountUpdates, 0);
});

['handleConnectGoogle', 'handleConnectKakao'].forEach((name) => {
  test(`${name} does not open a social login after its settings lookup crosses sessions`, async () => {
    const read = deferred();
    const app = setup({
      getItem: (key, values) => (key === 'rememberMe' ? read.promise : values.get(key)),
    });
    const opened = [];
    const alerts = [];
    const processing = [];
    const callback = loadScreenCallback('app/profile/edit.tsx', name, {
      ...app.session,
      getRememberMe: app.auth.getRememberMe,
      processingProvider: null,
      setProcessingProvider: (value) => processing.push(value),
      useKakaoAuthStore: app.kakao,
      GoogleSignin: { signOut: async () => opened.push('google') },
      WebBrowser: { openAuthSessionAsync: async () => opened.push('kakao') },
      getKakaoAuthorizeUrl: () => 'https://example.test/authorize',
      KAKAO_REDIRECT_URI: 'example://callback',
      Alert: { alert: (...args) => alerts.push(args) },
    });
    const pending = callback();
    await app.auth.clearSession();
    await app.auth.saveAuthTokens(refreshed, app.session.getSessionVersion());
    read.resolve('true');
    await pending;
    assert.equal(opened.length, 0);
    assert.equal(alerts.length, 0);
    assert.equal(processing.length, 1);
    assert.equal(app.kakao.getState().rememberMe, false);
  });
});

['during', 'after'].forEach((timing) => {
  test(`a stale-token lookup finishing ${timing} rotation cannot suppress a needed refresh`, async () => {
    const lookup = deferred();
    const refresh = deferred();
    let blockLookup = false;
    let blocked = false;
    const app = setup({
      getItem: (key, values) => {
        if (key === 'accessToken' && blockLookup && !blocked) {
          blocked = true;
          return lookup.promise;
        }
        return values.get(key);
      },
      refresh: () => refresh.promise,
      adapter: (config) =>
        config.headers.Authorization === 'Bearer new-access'
          ? success(config)
          : unauthorized(config),
    });
    await app.auth.saveAuthTokens(
      { accessToken: 'current-access', refreshToken: 'current-refresh' },
      app.session.getSessionVersion()
    );
    blockLookup = true;
    const oldRequest = app.auth.apiClient.get('/old', {
      headers: { Authorization: 'Bearer obsolete-access' },
    });
    await flush();
    const currentRequest = app.auth.apiClient.get('/current', {
      headers: { Authorization: 'Bearer current-access' },
    });
    const pending = Promise.allSettled([oldRequest, currentRequest]);
    await flush();
    const startedRefreshes = app.refreshCalls.length;
    if (timing === 'after') {
      refresh.resolve({ data: { result: refreshed } });
      await flush();
    }
    lookup.resolve('current-access');
    refresh.resolve({ data: { result: refreshed } });
    const results = await pending;
    assert.equal(startedRefreshes, 1);
    results.forEach((result) => assert.equal(result.status, 'fulfilled'));
    assert.equal(app.refreshCalls.length, 1);
  });
});

['accessToken', 'refreshToken'].forEach((key) => {
  test(`a failed ${key} write cannot leave mixed credentials in an authenticated session`, async () => {
    const app = setup({
      beforeWrite: (name) => {
        if (name === key) throw new Error('Storage write failed');
      },
    });
    const version = app.session.getSessionVersion();
    await assert.rejects(app.auth.saveAuthTokens(refreshed, version));
    assert.equal(app.session.getSessionSnapshot().authenticated, false);
    assert.equal(app.values.has('accessToken'), false);
    assert.equal(app.values.has('refreshToken'), false);
    assert.equal(app.navigations.length, 1);
    await assert.rejects(app.request(), axios.isCancel);
    assert.equal(app.refreshCalls.length, 0);
  });
});

test('access-token read failures share refresh without deleting usable refresh credentials', async () => {
  const refresh = deferred();
  const app = setup({
    getItem: (key, values) => {
      if (key === 'accessToken') throw new Error('Access token read failed');
      return values.get(key);
    },
    refresh: () => refresh.promise,
    adapter: (config) =>
      config.headers.Authorization === 'Bearer new-access' ? success(config) : unauthorized(config),
  });
  const pending = Promise.all([app.request(), app.request()]);
  await flush();
  assert.equal(app.refreshCalls.length, 1);
  assert.equal(app.refreshCalls[0][1].refreshToken, tokens.refreshToken);
  refresh.resolve({ data: { result: refreshed } });
  await pending;
  assert.equal(app.deletions.length, 0);
  assert.equal(app.navigations.length, 0);
  assert.equal(app.values.get('refreshToken'), refreshed.refreshToken);
});

test('a delayed access-token read failure cannot erase a newer saved token pair', async () => {
  const read = deferred();
  let firstRead = true;
  const app = setup({
    getItem: (key, values) => {
      if (key === 'accessToken' && firstRead) {
        firstRead = false;
        return read.promise;
      }
      return values.get(key);
    },
    adapter: (config) =>
      config.headers.Authorization === 'Bearer new-access' ? success(config) : unauthorized(config),
  });
  const version = app.session.getSessionVersion();
  const pending = app.request();
  await flush();
  await app.auth.saveAuthTokens(refreshed, version);
  assert.equal(app.session.getSessionVersion(), version);
  read.reject(new Error('Old lookup failed'));
  await pending;
  assert.equal(app.refreshCalls.length, 0);
  assert.equal(app.deletions.length, 0);
  assert.equal(app.navigations.length, 0);
  assert.equal(app.values.get('refreshToken'), refreshed.refreshToken);
});

test('a canceled access-token lookup does not refresh or clear the session', async () => {
  const app = setup({
    getItem: () => {
      throw new axios.CanceledError('Lookup canceled');
    },
  });
  await assert.rejects(app.request(), axios.isCancel);
  assert.equal(app.refreshCalls.length, 0);
  assert.equal(app.deletions.length, 0);
  assert.equal(app.session.getSessionSnapshot().authenticated, true);
});

['accessToken', 'refreshToken'].forEach((key) => {
  test(`recoverable ${key} write failure preserves drafts but blocks authentication`, async () => {
    const app = setup({
      beforeWrite: (name) => {
        if (name === key) throw new Error('Storage write failed');
      },
    });
    app.registration.setState({ signupDone: true, children: [childPayload] });
    app.google.setState({ rememberMe: true });
    app.kakao.setState({ rememberMe: true });
    const version = app.session.getSessionVersion();
    await assert.rejects(
      app.auth.saveAuthTokens(refreshed, version, { allowRetry: true }),
      (error) =>
        error instanceof app.auth.TokenStorageRetryError &&
        error.sessionVersion === app.session.getSessionVersion()
    );
    assert.equal(app.session.getSessionSnapshot().authenticated, false);
    assert.equal(app.values.size, 0);
    assert.equal(app.registration.getState().signupDone, true);
    assert.equal(app.registration.getState().children.length, 1);
    assert.equal(app.google.getState().rememberMe, false);
    assert.equal(app.kakao.getState().rememberMe, false);
    assert.equal(app.navigations.length, 0);
    assert.equal(app.getGoogleSignOutCalls(), 0);
    await assert.rejects(app.request(), axios.isCancel);
    await app.auth.clearSession();
    assert.equal(app.registration.getState().children.length, 0);
    assert.equal(app.navigations.length, 1);
  });
});

test('explicit logout takes precedence over pending token-storage recovery', async () => {
  const deletion = deferred();
  const app = setup({
    beforeWrite: () => {
      throw new Error('Storage write failed');
    },
    beforeDelete: () => deletion.promise,
  });
  app.registration.setState({ signupDone: true, children: [childPayload] });
  const write = assert.rejects(
    app.auth.saveAuthTokens(refreshed, app.session.getSessionVersion(), { allowRetry: true }),
    axios.isCancel
  );
  await flush();
  const cleanup = app.auth.clearSession();
  assert.equal(app.registration.getState().children.length, 0);
  deletion.resolve();
  await Promise.all([write, cleanup]);
  assert.equal(app.navigations.length, 1);
  assert.equal(app.getGoogleSignOutCalls(), 1);
});

test('a reentrant logout during recovery invalidation cannot become a retryable error', async () => {
  const app = setup({
    beforeWrite: () => {
      throw new Error('Storage write failed');
    },
  });
  app.registration.setState({ signupDone: true, children: [childPayload] });
  app.auth.subscribeSessionCleanup((phase, reason) => {
    if (phase === 'invalidated' && reason === 'token-storage-retry') app.auth.clearSession();
  });
  await assert.rejects(
    app.auth.saveAuthTokens(refreshed, app.session.getSessionVersion(), { allowRetry: true }),
    axios.isCancel
  );
  assert.equal(app.registration.getState().children.length, 0);
  assert.equal(app.navigations.length, 1);
});

const findElement = (node, predicate) => {
  if (!node || typeof node !== 'object') return undefined;
  if (predicate(node)) return node;
  const children = [node.props?.children].flat();
  return children.map((child) => findElement(child, predicate)).find(Boolean);
};

const registrationScreen = (app, api) => {
  const t = (key) => key;
  const jsx = (type, props) => ({ type, props });
  return hookHarness('app/(auth)/register/complete.tsx', (react) => ({
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': {
      ActivityIndicator: 'ActivityIndicator',
      ScrollView: 'ScrollView',
      Text: 'Text',
      TouchableOpacity: 'TouchableOpacity',
      View: 'View',
      StyleSheet: { create: (styles) => styles },
    },
    'react-i18next': { useTranslation: () => ({ t }) },
    'react-native-confetti-cannon': { default: 'ConfettiCannon' },
    'react-native-svg': { default: 'Svg' },
    '../../../src/components/common/Button': { PrimaryButton: 'PrimaryButton' },
    '../../../src/constants/colors': { default: app.load('src/constants/colors.ts').default },
    '../../../src/constants/fonts': { default: app.load('src/constants/fonts.ts').default },
    '../../../src/constants/layout': { default: { screenPaddingHorizontal: 20 } },
    '../../../src/auth/session': app.auth,
    '../../../src/utils/authSession': app.session,
    '../../../src/store/registerStore': { useRegisterStore: app.registration },
    '../../../src/store/googleAuthStore': { useGoogleAuthStore: app.google },
    '../../../src/store/kakaoAuthStore': { useKakaoAuthStore: app.kakao },
    '../../../src/api/auth': api,
    '../../../src/api/child': { registerChild: api.registerChild },
    '../../../src/query/hooks': {
      useApiMutation: (fn) => {
        const { version } = react.useSyncExternalStore(
          app.session.subscribeSession,
          app.session.getSessionSnapshot
        );
        return react.useCallback(
          async (...args) => {
            app.session.assertCurrentSession(version);
            const result = await fn(...args);
            app.session.assertCurrentSession(version);
            return result;
          },
          [fn, version]
        );
      },
    },
  }));
};

['normal', 'google', 'kakao'].forEach((authMethod) => {
  ['accessToken', 'refreshToken'].forEach((key) => {
    test(`${authMethod} signup retries a ${key} storage failure on the same screen`, async () => {
      let failWrite = true;
      const app = setup({
        beforeWrite: (name) => {
          if (failWrite && name === key) throw new Error('Storage write failed');
        },
      });
      const children = [childPayload, { ...childPayload, name: 'Second child' }];
      app.google.setState({ rememberMe: true });
      app.kakao.setState({ rememberMe: true });
      app.registration.setState({
        loginId: 'parent',
        password: 'password',
        authMethod,
        signupToken: 'signup-token',
        children,
      });
      const calls = { signup: 0, login: 0, children: [] };
      const signup = async () => {
        calls.signup += 1;
        return { ...refreshed, rememberMe: true };
      };
      const runner = registrationScreen(app, {
        signup,
        signupWithGoogle: signup,
        signupWithKakao: signup,
        login: async () => {
          calls.login += 1;
          return refreshed;
        },
        registerChild: async (child, version) => {
          app.session.assertSessionAuthenticated(version);
          calls.children.push(child.name);
        },
      });
      try {
        runner.render();
        await runner.flush();
        await runner.flush();
        assert.equal(app.registration.getState().signupDone, true);
        assert.equal(app.registration.getState().children.length, 2);
        assert.equal(calls.signup, 1);
        assert.equal(calls.login, authMethod === 'normal' ? 1 : 0);
        assert.equal(calls.children.length, 0);
        assert.equal(app.values.size, 0);
        const retry = findElement(
          runner.result,
          (node) =>
            node.type === 'TouchableOpacity' &&
            node.props.children?.props?.children === 'common.retry'
        );
        assert.ok(retry, 'a retry button must remain visible after session invalidation');
        failWrite = false;
        await retry.props.onPress();
        await runner.flush();
        assert.equal(calls.signup, 1, 'a successful server signup must never be repeated');
        assert.equal(calls.login, authMethod === 'normal' ? 2 : 0);
        assert.deepEqual(
          calls.children,
          children.map((child) => child.name)
        );
        assert.ok(findElement(runner.result, (node) => node.type === 'PrimaryButton'));
        assert.equal(app.registration.getState().children.length, 0);
        assert.equal(app.session.getSessionSnapshot().authenticated, true);
        if (authMethod !== 'normal') assert.equal(app.values.get('rememberMe'), 'true');
        assert.equal(app.navigations.length, 0);
      } finally {
        runner.unmount();
      }
    });
  });
});

test('a normal signup retry preserves child progress and registers only remaining children', async () => {
  let failWrite = true;
  const app = setup({
    beforeWrite: () => {
      if (failWrite) throw new Error('Storage write failed');
    },
  });
  app.registration.setState({
    loginId: 'parent',
    password: 'password',
    signupDone: true,
    children: [childPayload, { ...childPayload, name: 'Remaining child' }],
    registeredChildrenCount: 1,
  });
  const registered = [];
  const runner = registrationScreen(app, {
    login: async () => refreshed,
    registerChild: async (child) => registered.push(child.name),
    signup: async () => assert.fail('signup already completed'),
  });
  try {
    runner.render();
    await runner.flush();
    assert.equal(app.registration.getState().registeredChildrenCount, 1);
    failWrite = false;
    const retry = findElement(runner.result, (node) => node.type === 'TouchableOpacity');
    assert.ok(retry);
    await retry.props.onPress();
    await runner.flush();
    assert.deepEqual(registered, ['Remaining child']);
    assert.ok(findElement(runner.result, (node) => node.type === 'PrimaryButton'));
  } finally {
    runner.unmount();
  }
});
