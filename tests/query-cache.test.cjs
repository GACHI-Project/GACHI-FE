/* eslint-env node */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const { MutationObserver } = require('@tanstack/react-query');
const { test, afterEach } = require('node:test');
const { queryRuntime } = require('./helpers/queryRuntime.cjs');
const { queuedApi, hookHarness } = require('./helpers/hookHarness.cjs');

const runtimes = new Set();
const setup = () => {
  const r = queryRuntime();
  runtimes.add(r);
  return r;
};
afterEach(() => {
  runtimes.forEach((r) => r.dispose());
  runtimes.clear();
});

test('two observers of the same resource share an in-flight request and fresh cache', async () => {
  const r = setup();
  const api = queuedApi();
  const { serverOptions } = r.load('src/query/options.ts');
  const options = { ...serverOptions(r.scope(), 'profile', [], api.request), staleTime: 60000 };
  const first = r.observe(options);
  const second = r.observe(options);
  assert.equal(api.calls.length, 1);
  api.calls[0].resolve({ name: 'Parent' });
  await r.flush();
  assert.equal(first.result.data.name, 'Parent');
  assert.equal(second.result.data.name, 'Parent');
  const third = r.observe(options);
  assert.equal(api.calls.length, 1);
  assert.equal(third.result.data.name, 'Parent');
});

test('failed background refresh retains the last successful data', async () => {
  const r = setup();
  const api = queuedApi();
  const { serverOptions } = r.load('src/query/options.ts');
  const view = r.observe(serverOptions(r.scope(), 'profile', [], api.request));
  api.calls[0].resolve({ name: 'Parent' });
  await r.flush();
  const refresh = view.result.refetch();
  api.calls[1].reject(new Error('Offline'));
  await refresh;
  assert.equal(view.result.isError, true);
  assert.equal(view.result.data.name, 'Parent');
});

test('related-resource invalidation refetches only matching domains of the current session', async () => {
  const r = setup();
  const profile = queuedApi();
  const children = queuedApi();
  const { serverOptions } = r.load('src/query/options.ts');
  r.observe(serverOptions(r.scope(), 'profile', [], profile.request));
  r.observe(serverOptions(r.scope(), 'children', [], children.request));
  profile.calls[0].resolve({ name: 'A' });
  children.calls[0].resolve([]);
  await r.flush();
  const refresh = r.load('src/query/client.ts').invalidateResources(['profile']);
  await r.flush();
  assert.equal(profile.calls.length, 2);
  assert.equal(children.calls.length, 1);
  profile.calls[1].resolve({ name: 'B' });
  await refresh;
});

[401, 403, 404, 409, 422].forEach((status) => {
  test(`HTTP ${status} is not automatically retried`, () => {
    const r = setup();
    const { retry } = r.defaults.queries;
    assert.equal(retry(0, Object.assign(new Error('Request failed'), { status })), false);
  });
});

test('transient query retries are bounded and mutations never retry or wait for reconnect', () => {
  const r = setup();
  const { retry } = r.defaults.queries;
  assert.equal(retry(0, new Error('Network failed')), true);
  assert.equal(retry(2, new Error('Network failed')), false);
  assert.equal(r.defaults.mutations.retry, false);
  assert.equal(r.defaults.mutations.networkMode, 'always');
});

test('imperative native mutations retain their starting session and do not update a new account', async () => {
  const r = setup();
  const api = queuedApi();
  const { executeSessionMutation } = r.load('src/query/operations.ts');
  const pending = executeSessionMutation(api.request, ['profile']).catch((error) => error);
  await r.flush();
  r.session.invalidateSession();
  r.session.markSessionAuthenticated(r.session.getSessionVersion());
  const key = r.key('profile');
  r.client.setQueryData(key, { name: 'New account' });
  api.calls[0].resolve({ name: 'Old account' });
  const error = await pending;
  assert.equal(error.code, 'ERR_CANCELED');
  assert.equal(r.client.getQueryData(key).name, 'New account');
});

const mutationHook = (r) => {
  const observer = new MutationObserver(r.client, {});
  return hookHarness(
    'src/query/hooks.ts',
    {
      '@react-navigation/native': { useIsFocused: () => true },
      'react-i18next': { useTranslation: () => ({ i18n: { language: 'ko' } }) },
      '@tanstack/react-query': {
        useMutation: (options) => {
          observer.setOptions(options);
          return { mutateAsync: observer.mutate };
        },
      },
      '../utils/authSession': r.session,
      './client': r.load('src/query/client.ts'),
      './options': {},
    },
    {},
    'useApiMutation'
  );
};

test('mutation hooks synchronously deduplicate identical submissions', async () => {
  const r = setup();
  const api = queuedApi();
  const runner = mutationHook(r);
  runner.render(api.request);
  const first = runner.result('payload');
  const second = runner.result('payload');
  assert.equal(first, second);
  await r.flush();
  assert.equal(api.calls.length, 1);
  api.calls[0].resolve('saved');
  await first;
  const next = runner.result('payload');
  await r.flush();
  assert.equal(api.calls.length, 2);
  api.calls[1].resolve('saved-again');
  await next;
  runner.unmount();
});

test('a callback captured by the previous account cannot send a write in the new session', async () => {
  const r = setup();
  const api = queuedApi();
  const runner = mutationHook(r);
  runner.render(api.request);
  const stale = runner.result;
  r.session.invalidateSession();
  r.session.markSessionAuthenticated(r.session.getSessionVersion());
  await runner.flush();
  await assert.rejects(stale('old-payload'));
  assert.equal(api.calls.length, 0);
  const current = runner.result('new-payload');
  await r.flush();
  api.calls[0].resolve('saved');
  await current;
  runner.unmount();
});

['hook', 'native'].forEach((kind) => {
  ['success', 'failure'].forEach((outcome) => {
    test(`${kind}: account changes during post-write reconciliation cancel the old ${outcome}`, async () => {
      const r = setup();
      const profile = queuedApi();
      const write = queuedApi();
      const { serverOptions } = r.load('src/query/options.ts');
      r.observe({
        ...serverOptions(r.scope(), 'profile', [], profile.request),
        initialData: { name: 'Old account' },
        staleTime: Infinity,
      });
      const runner = kind === 'hook' ? mutationHook(r) : null;
      runner?.render(write.request, ['profile']);
      const operation = runner
        ? runner.result()
        : r.load('src/query/operations.ts').executeSessionMutation(write.request, ['profile']);
      const pending = operation.catch((error) => error);
      await r.flush();
      if (outcome === 'success') write.calls[0].resolve('saved');
      else write.calls[0].reject(new Error('Old account write failed'));
      await r.flush();
      assert.equal(profile.calls.length, 1);
      r.session.invalidateSession();
      r.session.markSessionAuthenticated(r.session.getSessionVersion());
      const key = r.key('profile');
      r.client.setQueryData(key, { name: 'New account' });
      const result = await pending;
      assert.equal(result.code, 'ERR_CANCELED');
      profile.calls[0].resolve({ name: 'Late old account' });
      await r.flush();
      assert.equal(r.client.getQueryData(key).name, 'New account');
      runner?.unmount();
    });
  });
});

const providerSetup = (os) => {
  let effect;
  let listener;
  let networkListener;
  let networkCleanup;
  let activeNetwork = 0;
  let activeApp = 0;
  const focused = [];
  const online = [];
  const filename = path.resolve(__dirname, '../src/query/QueryProvider.tsx');
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => {
      const modules = {
        react: {
          useEffect: (callback) => {
            effect = callback;
          },
        },
        'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
        'react-native': {
          Platform: { OS: os },
          AppState: {
            currentState: 'active',
            addEventListener: (_event, callback) => {
              listener = callback;
              activeApp += 1;
              return {
                remove: () => {
                  activeApp -= 1;
                },
              };
            },
          },
        },
        '@react-native-community/netinfo': {
          default: {
            addEventListener: (callback) => {
              networkListener = callback;
              activeNetwork += 1;
              return () => {
                activeNetwork -= 1;
              };
            },
          },
        },
        '@tanstack/react-query': {
          QueryClientProvider: 'QueryClientProvider',
          focusManager: { setFocused: (value) => focused.push(value) },
          onlineManager: {
            setEventListener: (install) => {
              networkCleanup?.();
              networkCleanup = install((value) => online.push(value));
            },
          },
        },
        './client': { queryClient: {} },
      };
      if (!(name in modules)) throw new Error(`Unexpected module: ${name}`);
      return modules[name];
    },
  });
  exports.default({ children: 'app' });
  return {
    mount: () => effect(),
    focused,
    online,
    app: (value) => listener(value),
    network: (value) => networkListener(value),
    counts: () => [activeNetwork, activeApp],
  };
};

['android', 'ios', 'web'].forEach((platform) => {
  test(`${platform}: provider connects native lifecycle events and cleans up listeners on remount`, () => {
    const provider = providerSetup(platform);
    let dispose = provider.mount();
    assert.deepEqual(provider.counts(), [1, platform === 'web' ? 0 : 1]);
    provider.network({ isConnected: false });
    assert.equal(provider.online.at(-1), false);
    provider.network({ isConnected: true, isInternetReachable: true });
    assert.equal(provider.online.at(-1), true);
    if (platform !== 'web') {
      provider.app('background');
      assert.equal(provider.focused.at(-1), false);
      provider.app('active');
      assert.equal(provider.focused.at(-1), true);
    }
    dispose();
    assert.deepEqual(provider.counts(), [0, 0]);
    dispose = provider.mount();
    assert.deepEqual(provider.counts(), [1, platform === 'web' ? 0 : 1]);
    dispose();
  });
});

const findElement = (tree, type) => {
  if (Array.isArray(tree)) return tree.map((child) => findElement(child, type)).find(Boolean);
  if (!tree || typeof tree !== 'object') return undefined;
  return tree.type === type ? tree : findElement(tree.props?.children, type);
};

const findAllElements = (tree, type) => {
  if (Array.isArray(tree)) return tree.flatMap((child) => findAllElements(child, type));
  if (!tree || typeof tree !== 'object') return [];
  return [...(tree.type === type ? [tree] : []), ...findAllElements(tree.props?.children, type)];
};

const translate = (key) => key;
const screenMocks = () => {
  const element = (type, props) => ({ type, props });
  const animation = () => ({ start: () => {}, stop: () => {} });
  class AnimatedValue {
    constructor() {
      this.value = 0;
    }

    setValue(value) {
      this.value = value;
    }

    stopAnimation() {
      this.value = 0;
    }

    interpolate() {
      return this.value;
    }
  }
  return {
    'react/jsx-runtime': { jsx: element, jsxs: element },
    'react-i18next': { useTranslation: () => ({ t: translate }) },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 0 }) },
    'react-native': {
      Modal: 'Modal',
      View: 'View',
      Pressable: 'Pressable',
      Alert: { alert: () => {} },
      StyleSheet: {},
      useWindowDimensions: () => ({ height: 800 }),
      Platform: { OS: 'android' },
      Keyboard: { addListener: () => ({ remove: () => {} }) },
      Animated: {
        Value: AnimatedValue,
        timing: animation,
        spring: animation,
        parallel: animation,
        sequence: animation,
        delay: animation,
        loop: animation,
      },
    },
  };
};

const previewSheet = (r, query) => {
  const runner = hookHarness('src/components/scan/result/SaveBottomSheet.tsx', {
    ...screenMocks(),
    '../../../api/calendar': { CalendarApiError: Error },
    '../../../i18n': { default: { t: translate } },
    '../../../query/hooks': { useApiMutation: (fn) => fn, useServerQuery: () => query },
    '../../../utils/calendarDday': {},
    '../../../utils/calendarEventTime': {},
    '../../../utils/calendarWeek': {},
    '../../../utils/calendarPreview': r.load('src/utils/calendarPreview.ts'),
    './ConfirmStep': { default: 'ConfirmStep' },
    './SuccessStep': { default: 'SuccessStep' },
    './styles': { default: {} },
  });
  const render = (newsletterId = 1, visible = true) => {
    runner.render({ newsletterId, visible, childName: 'Child' });
    return findElement(runner.result, 'ConfirmStep').props;
  };
  return { runner, render, current: () => findElement(runner.result, 'ConfirmStep').props };
};

const previewItem = (id, date = '2026-11-21') => ({
  tempEventId: id,
  title: id,
  extractedDate: date,
  isDateExtracted: true,
});

test('invalid calendar preview data shows an error instead of an endless loading indicator', () => {
  const r = setup();
  const query = { data: [previewItem('bad', 'invalid-date')], isFetching: false };
  const sheet = previewSheet(r, query);
  let view = sheet.render();
  assert.equal(view.previewLoading, false);
  assert.equal(view.previewError, 'scan.result.saveBottomSheet.error.loadFailed');
  assert.equal(view.canRegister, false);
  query.data = [previewItem('recovered')];
  view = sheet.render();
  assert.equal(view.previewError, null);
  assert.equal(view.canRegister, true);
  sheet.runner.unmount();
});

test('a missing newsletter id does not leave the calendar sheet loading', () => {
  const r = setup();
  const sheet = previewSheet(r, {});
  const view = sheet.render(null);
  assert.equal(view.previewLoading, false);
  assert.ok(view.previewError);
  assert.equal(view.canRegister, false);
  sheet.runner.unmount();
});

test('background preview refresh preserves the opened form and reopening starts a fresh draft', () => {
  const r = setup();
  const query = { data: [previewItem('first')], isFetching: false };
  const sheet = previewSheet(r, query);
  sheet.render().onUpdate('first', { day: '22' });
  sheet.render();
  query.data = [previewItem('new-preview')];
  let view = sheet.render();
  assert.deepEqual(
    Array.from(view.previews, (item) => item.tempEventId),
    ['first']
  );
  assert.equal(view.eventStates.first.day, '22');
  sheet.render(1, false);
  view = sheet.render();
  assert.deepEqual(
    Array.from(view.previews, (item) => item.tempEventId),
    ['new-preview']
  );
  assert.equal(view.eventStates['new-preview'].day, '21');
  sheet.runner.unmount();
});

const scanLoadingScreen = (r, query) => {
  const upload = queuedApi();
  const alerts = [];
  const mocks = screenMocks();
  const runner = hookHarness('app/scan/loading.tsx', {
    ...mocks,
    'react-native': { ...mocks['react-native'], Alert: { alert: (...args) => alerts.push(args) } },
    '@expo/vector-icons': {},
    'expo-router': { useLocalSearchParams: () => ({ photoUri: 'scan.jpg' }) },
    '../../src/api/newsletter': { uploadNewsletter: upload.request, NewsletterApiError: Error },
    '../../src/components/common/Header': {},
    '../../src/components/scan/ScanHelpModal': {},
    '../../src/components/scan/ScanStepIndicator': {},
    '../../src/constants/colors': { default: { primary: {}, text: {} } },
    '../../src/constants/scan': {},
    '../../src/hooks/useResponsiveLayout': { default: () => ({ height: 800 }) },
    '../../src/query/client': r.load('src/query/client.ts'),
    '../../src/query/hooks': {
      useApiMutation: (fn) => fn,
      useServerQuery: () => query,
      useSessionScope: () => r.scope(),
    },
    '../../src/styles/scan/loading': { default: {} },
    '../../src/utils/newsletterPaused': {},
    '../../src/utils/scanNavigation': {},
  });
  runner.render();
  return { runner, upload, alerts };
};

test('analysis completion invalidates document results after the upload mutation has settled', async () => {
  const r = setup();
  const query = { data: { status: 'PROCESSING' }, refetch: () => Promise.resolve() };
  ['newsletters', 'newsletter', 'recent', 'summary', 'newsletterChecklist', 'translation'].forEach(
    (domain) => r.client.setQueryData(r.key(domain, 1), { old: true })
  );
  r.client.setQueryData(r.key('profile'), { name: 'Parent' });
  const { runner, upload } = scanLoadingScreen(r, query);
  upload.calls[0].resolve({ newsletterId: 1 });
  await runner.flush();
  assert.equal(r.client.getQueryState(r.key('summary', 1)).isInvalidated, false);
  query.data = { status: 'COMPLETED', progressPercent: 100 };
  runner.render();
  await r.flush();
  assert.equal(r.client.getQueryState(r.key('summary', 1)).isInvalidated, true);
  assert.equal(r.client.getQueryState(r.key('newsletters', 1)).isInvalidated, true);
  assert.equal(r.client.getQueryState(r.key('profile')).isInvalidated, false);
  runner.unmount();
});

test('a second failed status refresh still offers the user another retry', async () => {
  const r = setup();
  const query = {
    data: { status: 'PROCESSING' },
    isError: true,
    errorUpdatedAt: 1,
    refetch: () => Promise.resolve({ isError: true }),
  };
  const { runner, upload, alerts } = scanLoadingScreen(r, query);
  upload.calls[0].resolve({ newsletterId: 1 });
  await runner.flush();
  assert.equal(alerts.length, 1);
  alerts[0][2][1].onPress();
  query.errorUpdatedAt = 2;
  runner.render();
  assert.equal(alerts.length, 2);
  assert.equal(alerts[1][2][1].text, 'scan.loading.paused.retryButton');
  runner.unmount();
});

const languageScreen = (r, api, saveLanguage = () => Promise.resolve()) => {
  const mocks = screenMocks();
  const changed = [];
  const i18n = { language: 'ko', changeLanguage: async (value) => changed.push(value) };
  const runner = hookHarness('app/profile/language.tsx', {
    ...mocks,
    'react-native': { ...mocks['react-native'], StyleSheet: { create: (value) => value } },
    'react-i18next': { useTranslation: () => ({ t: translate, i18n }) },
    '@expo/vector-icons': {},
    'expo-router': { router: { back: () => {} } },
    '../../src/api/user': { updateLanguage: api.request },
    '../../src/components/common/Button': { PrimaryButton: 'PrimaryButton' },
    '../../src/components/common/Header': {},
    '../../src/components/profile/LanguageSelector': { default: 'LanguageSelector' },
    '../../src/constants/colors': { default: { text: {}, secondary: {} } },
    '../../src/constants/fonts': { default: {} },
    '../../src/constants/layout': { default: {} },
    '../../src/i18n': { saveLanguage, SUPPORTED_LANGUAGES: ['ko', 'en'] },
    '../../src/query/client': r.load('src/query/client.ts'),
    '../../src/query/hooks': { useApiMutation: (fn) => fn },
    '../../src/types/language': { toServerLanguageCode: (value) => value.toUpperCase() },
    '../../src/utils/authSession': r.session,
  });
  runner.render();
  findElement(runner.result, 'LanguageSelector').props.onSelect('en');
  runner.render();
  return {
    runner,
    changed,
    save: () => findElement(runner.result, 'PrimaryButton').props.onPress(),
  };
};

test('changing language cancels late responses and removes cached results before using new keys', async () => {
  const r = setup();
  const queryApi = queuedApi();
  const api = queuedApi();
  const { serverOptions } = r.load('src/query/options.ts');
  const ko = serverOptions(r.scope(), 'translation', [1], queryApi.request);
  r.observe(ko);
  const enKey = r.load('src/query/client.ts').resourceKey(0, 'en', 'translation', 1);
  r.client.setQueryData(enKey, { text: 'Old translation' });
  const screen = languageScreen(r, api);
  const save = screen.save();
  api.calls[0].resolve();
  await save;
  assert.equal(queryApi.calls[0].args[0].aborted, true);
  assert.equal(r.client.getQueryData(ko.queryKey), undefined);
  assert.equal(r.client.getQueryData(enKey), undefined);
  assert.deepEqual(screen.changed, ['en']);
  queryApi.calls[0].resolve({ text: 'Late old-language response' });
  await r.flush();
  assert.equal(r.client.getQueryData(ko.queryKey), undefined);
  screen.runner.unmount();
});

test('language persistence from the previous account cannot clear a new account cache', async () => {
  const r = setup();
  const api = queuedApi();
  const storage = queuedApi();
  const screen = languageScreen(r, api, storage.request);
  const save = screen.save();
  api.calls[0].resolve();
  await r.flush();
  r.session.invalidateSession();
  r.session.markSessionAuthenticated(r.session.getSessionVersion());
  const key = r.key('profile');
  r.client.setQueryData(key, { name: 'New account' });
  storage.calls[0].resolve();
  await save;
  assert.deepEqual(screen.changed, []);
  assert.equal(r.client.getQueryData(key).name, 'New account');
  screen.runner.unmount();
});

const pendingLinkSetup = (r) => {
  const link = queuedApi();
  const tokens = queuedApi();
  let pending = { provider: 'google', linkToken: 'old-link-token' };
  const runner = hookHarness(
    'src/utils/pendingLink.ts',
    {
      'react-native': { Alert: { alert: () => {} } },
      '../api/auth': {
        AuthApiError: Error,
        linkGoogle: link.request,
        linkKakao: link.request,
        saveAuthTokens: tokens.request,
      },
      '../i18n': { default: { t: translate } },
      '../query/client': r.load('src/query/client.ts'),
      '../query/operations': r.load('src/query/operations.ts'),
      '../store/socialLinkStore': {
        useSocialLinkStore: {
          getState: () => ({
            pendingLink: pending,
            clearPendingLink: () => {
              pending = null;
            },
          }),
        },
      },
      './authSession': r.session,
    },
    {},
    'attemptPendingLink'
  );
  return {
    link,
    tokens,
    run: () => runner.render(pending, true, r.session.getSessionVersion()),
    getPending: () => pending,
    setPending: (value) => {
      pending = value;
    },
  };
};

test('social linking saves rotated credentials before refetching the profile', async () => {
  const r = setup();
  const profile = queuedApi();
  const { serverOptions } = r.load('src/query/options.ts');
  r.observe({
    ...serverOptions(r.scope(), 'profile', [], profile.request),
    initialData: { googleLinked: false },
    staleTime: Infinity,
  });
  const workflow = pendingLinkSetup(r);
  const pending = workflow.run();
  await r.flush();
  workflow.link.calls[0].resolve({ accessToken: 'new-access', refreshToken: 'new-refresh' });
  await r.flush();
  assert.equal(workflow.tokens.calls.length, 1);
  assert.equal(profile.calls.length, 0);
  workflow.tokens.calls[0].resolve();
  await r.flush();
  assert.equal(profile.calls.length, 1);
  profile.calls[0].resolve({ googleLinked: true });
  await pending;
  assert.equal(workflow.getPending(), null);
});

['success', 'failure'].forEach((outcome) => {
  test(`an old social link ${outcome} cannot clear a new account's pending link`, async () => {
    const r = setup();
    const workflow = pendingLinkSetup(r);
    const pending = workflow.run();
    await r.flush();
    r.session.invalidateSession();
    r.session.markSessionAuthenticated(r.session.getSessionVersion());
    const newLink = { provider: 'kakao', linkToken: 'new-link-token' };
    workflow.setPending(newLink);
    if (outcome === 'success') workflow.link.calls[0].resolve({ accessToken: 'old-access' });
    else workflow.link.calls[0].reject(new Error('Old workflow failed'));
    await pending;
    assert.equal(workflow.getPending(), newLink);
    assert.equal(workflow.tokens.calls.length, 0);
  });
});

const notificationSettings = (r) => {
  const api = queuedApi();
  const alerts = [];
  const mocks = screenMocks();
  const key = r.key('profile');
  r.client.setQueryData(key, { notificationPreference: 'ALL' });
  const runner = hookHarness('app/profile/notification.tsx', {
    ...mocks,
    axios: require('axios'),
    'react-native': {
      ...mocks['react-native'],
      TouchableOpacity: 'Tab',
      Alert: { alert: (...args) => alerts.push(args) },
    },
    'expo-router': {},
    '../../src/api/user': { updateNotificationPreference: api.request },
    '../../src/components/common/Header': {},
    '../../src/components/common/Toggle': { default: 'Toggle' },
    '../../src/constants/layout': { default: {} },
    '../../src/query/hooks': { useApiMutation: (fn) => fn },
    '../../src/query/resources': {
      useProfileQuery: () => ({ data: r.client.getQueryData(key) }),
    },
    '../../src/styles/profile/profileNotification': {
      default: { segmentTabSelected: 'selected' },
    },
  });
  const tabs = () => findAllElements(runner.result, 'Tab');
  runner.render();
  return {
    api,
    alerts,
    runner,
    key,
    tabs,
    toggle: () => findElement(runner.result, 'Toggle').props,
    selected: () => tabs().findIndex((tab) => tab.props.style.includes('selected')),
  };
};

test('failed notification preference writes restore the confirmed selection', async () => {
  const r = setup();
  const screen = notificationSettings(r);
  const pending = screen.tabs()[2].props.onPress();
  screen.api.calls[0].reject(new Error('Preference write failed'));
  await pending;
  screen.runner.render();
  assert.equal(screen.selected(), 0);
  assert.equal(screen.alerts.length, 1);
  screen.runner.unmount();
});

test('notification preference writes prevent conflicting submissions before a rerender', async () => {
  const r = setup();
  const screen = notificationSettings(r);
  const pending = screen.toggle().onValueChange(false);
  const duplicate = screen.tabs()[2].props.onPress();
  assert.equal(screen.api.calls.length, 1);
  screen.runner.render();
  assert.equal(screen.toggle().disabled, true);
  assert.ok(screen.tabs().every((tab) => tab.props.disabled));
  r.client.setQueryData(screen.key, { notificationPreference: 'OFF' });
  screen.api.calls[0].resolve();
  await Promise.all([pending, duplicate]);
  screen.runner.render();
  assert.equal(screen.toggle().disabled, false);
  assert.equal(screen.toggle().value, false);
  screen.runner.unmount();
});

test('notification settings follow later server changes after a completed write', async () => {
  const r = setup();
  const screen = notificationSettings(r);
  const pending = screen.tabs()[2].props.onPress();
  r.client.setQueryData(screen.key, { notificationPreference: 'URGENT_ONLY' });
  screen.api.calls[0].resolve();
  await pending;
  screen.runner.render();
  assert.equal(screen.selected(), 2);
  r.client.setQueryData(screen.key, { notificationPreference: 'ALL' });
  screen.runner.render();
  assert.equal(screen.selected(), 0);
  screen.runner.unmount();
});

['save', 'remove'].forEach((action) => {
  test(`child ${action} invalidates embedded child names in home tasks and document details`, async () => {
    const r = setup();
    const api = queuedApi();
    const hooks = [];
    const runner = hookHarness('src/hooks/profile/useChildMutations.ts', {
      '../../api/child': {
        registerChild: api.request,
        updateChild: api.request,
        deleteChild: api.request,
      },
      '../../query/hooks': {
        useApiMutation: (fn, domains) => {
          const hook = mutationHook(r);
          hooks.push(hook);
          hook.render(fn, domains);
          return hook.result;
        },
      },
    });
    const taskKey = r.key('today', '2026-11-21');
    const detailKey = r.key('newsletter', 1);
    const profileKey = r.key('profile');
    [taskKey, detailKey, profileKey].forEach((key) =>
      r.client.setQueryData(key, { childName: 'Old name' })
    );
    runner.render();
    const pending =
      action === 'save'
        ? runner.result.saveChild({ id: '1', name: 'New name' }, false)
        : runner.result.removeChild('1');
    await r.flush();
    api.calls[0].resolve();
    await pending;
    assert.equal(r.client.getQueryState(taskKey).isInvalidated, true);
    assert.equal(r.client.getQueryState(detailKey).isInvalidated, true);
    assert.equal(r.client.getQueryState(profileKey).isInvalidated, false);
    hooks.forEach((hook) => hook.unmount());
    runner.unmount();
  });
});

test('home tasks switch their cache key and displayed date when the day changes', () => {
  let today = '2026-11-30';
  const keys = [];
  const mocks = screenMocks();
  const runner = hookHarness('src/components/home/TaskCard.tsx', {
    ...mocks,
    'react-native': { ...mocks['react-native'], Text: 'Text' },
    'expo-router': {},
    '../../api/checklist': {},
    '../../constants/colors': { default: { primary: {} } },
    '../../hooks/useCurrentDate': { default: () => today },
    '../../query/checklists': {},
    '../../query/hooks': {
      useApiMutation: (fn) => fn,
      useServerQuery: (domain, params) => {
        keys.push([domain, ...params]);
        return { data: [] };
      },
    },
    '../../query/resources': { useChildrenQuery: () => ({ data: [] }) },
    './taskCard.styles': { default: {} },
    './TodoItem': {},
  });
  runner.render();
  assert.deepEqual(keys.at(-1), ['today', '2026-11-30']);
  today = '2026-12-01';
  runner.render();
  assert.deepEqual(keys.at(-1), ['today', '2026-12-01']);
  const text = findAllElements(runner.result, 'Text').map((node) => node.props.children);
  assert.ok(text.includes('DEC'));
  assert.ok(text.includes(1));
  runner.unmount();
});
