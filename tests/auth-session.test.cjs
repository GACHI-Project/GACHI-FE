/* eslint-env node */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const axios = require('axios');
const ts = require('typescript');
const zustand = require('zustand');

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
  await first;
  assert.equal(app.user.getState().name, '');
  assert.equal(app.children.getState().children.length, 0);
  assert.equal(app.notifications.getState().unreadCount, 0);
  assert.equal(app.registration.getState().signupToken, '');
  assert.equal(app.kakao.getState().rememberMe, false);
  assert.equal(app.google.getState().rememberMe, false);
  assert.equal(app.getGoogleSignOutCalls(), 1);
  assert.deepEqual(app.deletions.sort(), ['accessToken', 'refreshToken']);
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
