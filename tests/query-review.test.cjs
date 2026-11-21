/* eslint-env node */
const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const { onlineManager } = require('@tanstack/react-query');
const { hookHarness, queuedApi } = require('./helpers/hookHarness.cjs');
const { queryRuntime } = require('./helpers/queryRuntime.cjs');

const runtimes = new Set();
const setup = (overrides) => {
  const runtime = queryRuntime(overrides);
  runtimes.add(runtime);
  return runtime;
};
afterEach(() => {
  onlineManager.setOnline(true);
  runtimes.forEach((runtime) => {
    runtime.client.unmount();
    runtime.dispose();
  });
  runtimes.clear();
});
const transient = () => Object.assign(new Error('Unavailable'), { status: 503 });
const t = (key) => key;
const elements = (tree, type) => {
  if (Array.isArray(tree)) return tree.flatMap((child) => elements(child, type));
  if (!tree || typeof tree !== 'object') return [];
  return [...(tree.type === type ? [tree] : []), ...elements(tree.props?.children, type)];
};
const ui = (r, prefix = '../../src/') => {
  class Value {
    constructor() {
      this.value = 0;
    }

    setValue(value) {
      this.value = value;
    }

    interpolate() {
      return this.value;
    }

    stopAnimation() {
      this.value = 0;
    }
  }
  const animation = () => ({ start: () => {}, stop: () => {} });
  const jsx = (type, props) => ({ type, props });
  return {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-i18next': { useTranslation: () => ({ t, i18n: { language: 'en' } }) },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 0 }) },
    '@expo/vector-icons': {},
    'react-native': {
      ...Object.fromEntries(
        [
          'View',
          'Text',
          'TouchableOpacity',
          'ScrollView',
          'FlatList',
          'Image',
          'Modal',
          'Pressable',
          'ActivityIndicator',
          'KeyboardAvoidingView',
          'TouchableWithoutFeedback',
        ].map((name) => [name, name])
      ),
      StyleSheet: { create: (styles) => styles, absoluteFill: {} },
      Platform: { OS: 'android' },
      useWindowDimensions: () => ({ width: 400, height: 800 }),
      Alert: { alert: () => {} },
      Keyboard: { addListener: () => ({ remove: () => {} }) },
      Animated: { Value, timing: animation, spring: animation, parallel: animation },
    },
    [`${prefix}constants/colors`]: r.load('src/constants/colors.ts'),
    [`${prefix}constants/fonts`]: r.load('src/constants/fonts.ts'),
    [`${prefix}constants/layout`]: r.load('src/constants/layout.ts'),
    [`${prefix}components/common/Header`]: { default: 'Header' },
    [`${prefix}components/common/QueryNotice`]: { default: 'QueryNotice' },
    [`${prefix}components/common/Button`]: { PrimaryButton: 'PrimaryButton' },
    [`${prefix}query/state`]: r.load('src/query/state.ts'),
  };
};

test('a confirmed notification preference survives a failed profile reconciliation', async () => {
  const write = queuedApi();
  const fetch = queuedApi();
  const r = setup({ user: { updateNotificationPreference: write.request } });
  const { serverOptions } = r.load('src/query/options.ts');
  const view = r.observe({
    ...serverOptions(r.scope(), 'profile', [], fetch.request),
    initialData: { notificationPreference: 'ALL', notificationEnabled: true },
    staleTime: Infinity,
  });
  const pending = r
    .load('src/query/operations.ts')
    .executeSessionMutation(
      () => r.load('src/query/profile.ts').saveNotificationPreference('OFF'),
      ['profile']
    );
  await r.flush();
  write.calls[0].resolve();
  await r.flush();
  assert.equal(view.result.data.notificationPreference, 'OFF');
  fetch.calls[0].reject(transient());
  await pending;
  assert.equal(view.result.isRefetchError, true);
  assert.equal(view.result.data.notificationPreference, 'OFF');
  assert.equal(view.result.data.notificationEnabled, false);
});

test('notification settings expose an initial profile error and recover through retry', async () => {
  const r = setup();
  const fetch = queuedApi();
  const view = r.observe(
    r.load('src/query/options.ts').serverOptions(r.scope(), 'profile', [], fetch.request)
  );
  fetch.calls[0].reject(transient());
  await r.flush();
  const runner = hookHarness('app/profile/notification.tsx', {
    ...ui(r),
    axios: require('axios'),
    'expo-router': {},
    '../../src/components/common/Toggle': { default: 'Toggle' },
    '../../src/query/hooks': { useApiMutation: (fn) => fn },
    '../../src/query/profile': {},
    '../../src/query/resources': { useProfileQuery: () => view.result },
    '../../src/styles/profile/profileNotification': { default: {} },
  });
  runner.render();
  const notice = elements(runner.result, 'QueryNotice')[0];
  assert.ok(notice);
  assert.equal(elements(runner.result, 'Toggle').length, 0);
  notice.props.onRetry();
  await r.flush();
  assert.equal(fetch.calls.length, 2);
  fetch.calls[1].resolve({ notificationPreference: 'OFF' });
  await r.flush();
  runner.render();
  assert.equal(elements(runner.result, 'QueryNotice').length, 0);
  const toggle = elements(runner.result, 'Toggle')[0].props;
  assert.equal(toggle.disabled, false);
  assert.equal(toggle.value, false);
  runner.unmount();
});

const calendarSetup = () => {
  const patch = queuedApi();
  const post = queuedApi();
  const preview = queuedApi();
  const r = setup({
    calendar: { patchCalendarPreviewDates: patch.request, postCalendarEvents: post.request },
  });
  const { serverOptions } = r.load('src/query/options.ts');
  const view = r.observe({
    ...serverOptions(r.scope(), 'preview', [1], preview.request),
    initialData: [
      { tempEventId: 'event', extractedDate: '2026-11-21', startAt: '2026-11-21', endAt: null },
    ],
    staleTime: Infinity,
  });
  const detailKey = r.key('newsletter', 1);
  r.client.setQueryData(detailKey, { isCalendarRegistered: false });
  const run = () =>
    r
      .load('src/query/calendar.ts')
      .registerNewsletterCalendar(
        1,
        [{ tempEventId: 'event', title: 'Event', startAt: '2026-11-25', endAt: null }],
        [{ tempEventId: 'event', correctedDate: '2026-11-25' }]
      );
  return { r, patch, post, preview, view, detailKey, run };
};

test('calendar registration sends POST after PATCH without awaiting preview refetch', async () => {
  const { r, patch, post, preview, detailKey, run } = calendarSetup();
  const pending = run();
  patch.calls[0].resolve();
  await r.flush();
  assert.equal(post.calls.length, 1);
  assert.equal(preview.calls.length, 0);
  post.calls[0].resolve({ registeredCount: 1 });
  await pending;
  assert.equal(preview.calls.length, 1);
  assert.equal(r.client.getQueryState(detailKey).isInvalidated, true);
});

test('a failed calendar date PATCH never sends registration POST', async () => {
  const { patch, post, run } = calendarSetup();
  const pending = run();
  patch.calls[0].reject(transient());
  await assert.rejects(pending);
  assert.equal(post.calls.length, 0);
});

test('calendar POST failure keeps confirmed dates when preview reconciliation also fails', async () => {
  const { r, patch, post, preview, view, run } = calendarSetup();
  const pending = run();
  patch.calls[0].resolve();
  await r.flush();
  post.calls[0].reject(transient());
  await assert.rejects(pending);
  preview.calls[0].reject(transient());
  await r.flush();
  assert.equal(view.result.data[0].startAt, '2026-11-25');
  assert.equal(view.result.data[0].extractedDate, '2026-11-25');
});

test('calendar transaction cannot continue its POST after an account change', async () => {
  const { r, patch, post, run } = calendarSetup();
  const pending = run();
  r.session.invalidateSession();
  patch.calls[0].resolve();
  await assert.rejects(pending, { code: 'ERR_CANCELED' });
  assert.equal(post.calls.length, 0);
});

test('manual document pagination respects authentication and pending search debounce', async () => {
  const r = setup();
  let authenticated = true;
  let debounced = 'previous';
  let more = 0;
  const runner = hookHarness('src/hooks/document/useNewsletterList.ts', {
    '@react-navigation/native': { useIsFocused: () => true },
    '@tanstack/react-query': {
      useInfiniteQuery: () => ({
        hasNextPage: true,
        fetchNextPage: async () => {
          more += 1;
        },
      }),
    },
    '../../query/client': r.load('src/query/client.ts'),
    '../../query/options': r.load('src/query/options.ts'),
    '../../query/state': r.load('src/query/state.ts'),
    '../../query/hooks': {
      useSessionScope: () => ({ ...r.scope(), authenticated }),
      useDebouncedValue: () => debounced,
    },
  });
  runner.render(undefined, 'cached');
  await runner.result.loadMore();
  assert.equal(more, 0);
  debounced = 'cached';
  authenticated = false;
  runner.render(undefined, 'cached');
  await runner.result.loadMore();
  assert.equal(more, 0);
  authenticated = true;
  runner.render(undefined, 'cached');
  await runner.result.loadMore();
  assert.equal(more, 1);
  runner.unmount();
});

test('manual class names survive failed refetches but successful lists validate selections', () => {
  const r = setup();
  const query = { data: [{ className: '1' }, { className: '2' }], isError: true, isSuccess: false };
  const updates = [];
  const runner = hookHarness(
    'app/(auth)/register/child.tsx',
    {
      ...ui(r, '../../../src/'),
      'expo-router': {},
      '../../../src/api/school': {},
      '../../../src/components/common/StepHeader': {},
      '../../../src/constants/child': {},
      '../../../src/query/hooks': { useServerQuery: () => query },
      '../../../src/store/registerStore': {},
      '../../../src/styles/register/child': { default: {} },
      '../../../src/styles/register/childCard': { default: {} },
    },
    {},
    'ClassPicker'
  );
  const props = {
    selectedSchool: { officeCode: 'O', schoolCode: 'S' },
    grade: 1,
    className: '3',
    onUpdate: (value) => updates.push(value),
  };
  runner.render(props);
  assert.equal(updates.length, 0);
  query.isError = false;
  query.isSuccess = true;
  runner.render(props);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].className, null);
  runner.unmount();
});

['refresh', 'initial', 'forbidden'].forEach((kind) => {
  test(`FAQ category distinguishes ${kind} errors while retaining only usable cache`, () => {
    const r = setup();
    let retries = 0;
    const query = {
      data: kind === 'initial' ? undefined : [{ faqId: 1, question: 'Question' }],
      error:
        kind === 'forbidden' ? Object.assign(new Error('Forbidden'), { status: 403 }) : transient(),
      isError: true,
      refetch: () => {
        retries += 1;
      },
    };
    const runner = hookHarness('app/guide/[category].tsx', {
      ...ui(r),
      'expo-router': { useLocalSearchParams: () => ({ categoryEnum: 'MEALS', category: 'Meals' }) },
      '../../src/api/schoolGuide': {},
      '../../src/query/hooks': { useServerQuery: () => query },
      '../../src/hooks/guide/useGuideFaqExpand': { default: () => ({ answerCache: {} }) },
      '../../src/styles/guide/categoryScreen': { default: {} },
    });
    runner.render();
    const lists = elements(runner.result, 'FlatList');
    assert.equal(lists.length, kind === 'refresh' ? 1 : 0);
    if (lists.length) assert.equal(lists[0].props.data.length, 1);
    const notice = elements(runner.result, 'QueryNotice')[0];
    assert.ok(notice);
    notice.props.onRetry();
    assert.equal(retries, 1);
    runner.unmount();
  });
});

['refresh', 'initial', 'forbidden'].forEach((kind) => {
  test(`recent documents preserve shortcuts only for a transient ${kind} failure`, () => {
    const r = setup();
    const query = {
      data:
        kind === 'initial'
          ? undefined
          : [
              {
                date: '2026-11-22',
                items: [{ newsletterId: 1, title: 'Saved notice', childName: 'Child' }],
              },
            ],
      error:
        kind === 'forbidden' ? Object.assign(new Error('Forbidden'), { status: 403 }) : transient(),
      refetch: () => {},
    };
    const runner = hookHarness('src/components/home/RecentDocs.tsx', {
      ...ui(r, '../../'),
      'expo-router': {},
      '../../api/newsletter': {},
      '../../query/hooks': { useServerQuery: () => query },
      '../common/QueryNotice': { default: 'QueryNotice' },
      './recentDocs.styles': { default: {} },
    });
    runner.render();
    const hasDocument = elements(runner.result, 'Text').some(
      (node) => node.props.children === 'Saved notice'
    );
    assert.equal(hasDocument, kind === 'refresh');
    assert.equal(elements(runner.result, 'QueryNotice').length, 1);
    runner.unmount();
  });
});

['initial', 'pagination', 'empty'].forEach((kind) => {
  test(`documents show the ${kind} state without confusing errors with an empty search`, () => {
    const r = setup();
    let retries = 0;
    const result = {
      newsletters:
        kind === 'pagination'
          ? [{ newsletterId: 1, title: 'Notice', status: 'COMPLETED', createdAt: '2026-11-22' }]
          : [],
      error: kind === 'empty' ? null : transient(),
      loadError: kind === 'initial',
      retry: async () => {
        retries += 1;
      },
    };
    const runner = hookHarness('app/(tabs)/document.tsx', {
      ...ui(r),
      'expo-router': { useRouter: () => ({}) },
      '../../src/components/common/ChildFilterBar': {},
      '../../src/components/document/DocumentCard': { default: 'DocumentCard' },
      '../../src/hooks/document/useNewsletterList': { default: () => result },
      '../../src/query/resources': { useChildrenQuery: () => ({ data: [] }) },
      '../../src/utils/date': { formatShortDate: () => 'Nov 22' },
    });
    runner.render();
    assert.equal(elements(runner.result, 'DocumentCard').length, kind === 'pagination' ? 1 : 0);
    const empty = elements(runner.result, 'Text').some(
      (node) => node.props.children === 'document.empty'
    );
    assert.equal(empty, kind === 'empty');
    if (kind !== 'empty') {
      elements(runner.result, 'QueryNotice')[0].props.onRetry();
      assert.equal(retries, 1);
    }
    runner.unmount();
  });
});

test('an offline initial translation waits and resumes on reconnect without showing failure', async () => {
  const r = setup();
  const api = queuedApi();
  onlineManager.setOnline(false);
  r.client.mount();
  const view = r.observe(
    r.load('src/query/options.ts').serverOptions(r.scope(), 'translation', [1], api.request)
  );
  const runner = hookHarness('src/components/scan/result/FullDocTab.tsx', {
    ...ui(r, '../../../'),
    '../../../api/newsletter': { NewsletterApiError: Error },
    '../../../query/hooks': { useServerQuery: () => view.result },
    '../../../types/language': { fromServerLanguageCode: () => 'en' },
    '../../common/CenteredMessage': { default: 'CenteredMessage' },
    '../../common/QueryNotice': { default: 'QueryNotice' },
    './FullDocPageSection': {},
    './PageImageViewerModal': {},
    './TextSection': { default: 'TextSection' },
  });
  runner.render({ newsletterId: 1 });
  assert.equal(view.result.isLoading, false);
  assert.equal(api.calls.length, 0);
  assert.equal(elements(runner.result, 'QueryNotice')[0].props.message, 'common.waitingConnection');
  onlineManager.setOnline(true);
  await r.flush();
  assert.equal(api.calls.length, 1);
  api.calls[0].resolve({ originalText: 'Original', translatedText: 'Translated', language: 'EN' });
  await r.flush();
  runner.render();
  assert.equal(elements(runner.result, 'QueryNotice').length, 0);
  assert.equal(elements(runner.result, 'TextSection').length, 2);
  runner.unmount();
});

const scanSelect = (r, query) => {
  const routes = [];
  const runner = hookHarness('app/scan/index.tsx', {
    ...ui(r),
    'expo-router': { router: { push: (route) => routes.push(route) } },
    'expo-document-picker': {},
    '../../src/components/common/SelectionCard': { default: 'SelectionCard' },
    '../../src/components/scan/ScanHelpModal': {},
    '../../src/components/scan/ScanStepIndicator': {},
    '../../src/constants/scan': {},
    '../../src/query/resources': { useChildrenQuery: () => query },
    '../../src/utils/scanImage': {},
  });
  runner.render();
  return {
    runner,
    routes,
    camera: () => elements(runner.result, 'PrimaryButton')[0].props,
  };
};
const child = (id, name = `Child ${id}`) => ({ id, name, grade: 1, colorCode: '#fff' });

test('scan distinguishes a failed child lookup from a successfully empty child list', () => {
  const r = setup();
  let retries = 0;
  const query = {
    error: transient(),
    refetch: () => {
      retries += 1;
    },
  };
  const screen = scanSelect(r, query);
  assert.equal(screen.camera().disabled, true);
  screen.camera().onPress();
  assert.equal(screen.routes.length, 0);
  elements(screen.runner.result, 'QueryNotice')[0].props.onRetry();
  assert.equal(retries, 1);
  query.error = null;
  query.data = [];
  screen.runner.render();
  assert.equal(screen.camera().disabled, false);
  screen.camera().onPress();
  assert.equal(screen.routes[0].params.childId, '');
  screen.runner.unmount();
});

test('scan keeps an explicit unassigned selection after child metadata is refreshed', () => {
  const r = setup();
  const query = { data: [child(1)] };
  const screen = scanSelect(r, query);
  screen.camera().onPress();
  assert.equal(screen.routes[0].params.childId, '1');
  elements(screen.runner.result, 'TouchableOpacity')
    .find((node) => node.props.accessibilityLabel === 'scan.select.unknown')
    .props.onPress();
  query.data = [child(1, 'Renamed')];
  screen.runner.render();
  screen.camera().onPress();
  assert.equal(screen.routes[1].params.childId, '');
  screen.runner.unmount();
});

test('scan replaces a selected child that was deleted with a remaining child', () => {
  const r = setup();
  const query = { data: [child(1), child(2)] };
  const screen = scanSelect(r, query);
  elements(screen.runner.result, 'SelectionCard')[1].props.onPress();
  screen.runner.render();
  query.data = [child(1)];
  screen.runner.render();
  screen.camera().onPress();
  assert.equal(screen.routes[0].params.childId, '1');
  screen.runner.unmount();
});

test('profile lookup failure offers retry before presenting account connection controls', () => {
  const r = setup();
  let retries = 0;
  const query = {
    error: transient(),
    refetch: () => {
      retries += 1;
    },
  };
  const runner = hookHarness('app/profile/edit.tsx', {
    ...ui(r),
    '@react-native-google-signin/google-signin': {},
    'expo-router': { useLocalSearchParams: () => ({}) },
    'expo-web-browser': {},
    '../../assets/social/google.png': {},
    '../../assets/social/kakao.png': {},
    '../../assets/icon.png': {},
    '../../src/api/auth': {},
    '../../src/api/user': {},
    '../../src/components/auth/FormField': {},
    '../../src/components/common/ConfirmModal': {},
    '../../src/constants/socialAuth': {},
    '../../src/query/hooks': { useApiMutation: (fn) => fn },
    '../../src/query/resources': { useProfileQuery: () => query },
    '../../src/store/kakaoAuthStore': {},
    '../../src/styles/profile/accountLink': { default: {} },
    '../../src/styles/profile/profileEdit': { default: {} },
    '../../src/utils/authSession': r.session,
    '../../src/utils/pendingLink': {},
    '../../src/validation/auth': {},
  });
  runner.render();
  assert.equal(elements(runner.result, 'TouchableOpacity').length, 0);
  elements(runner.result, 'QueryNotice')[0].props.onRetry();
  assert.equal(retries, 1);
  query.error = null;
  query.data = {
    loginId: 'parent',
    name: 'Name',
    passwordLoginAvailable: true,
    googleLinked: true,
  };
  runner.render();
  assert.ok(elements(runner.result, 'TouchableOpacity').length > 0);
  assert.equal(elements(runner.result, 'QueryNotice').length, 0);
  runner.unmount();
});

const page = (ids, nextCursor = null) => ({
  notifications: ids.map((id) => ({
    id,
    read: false,
    type: 'SYSTEM',
    title: 'Notice',
    body: 'Body',
    payload: {},
    createdAt: '2026-11-22T00:00:00',
  })),
  hasNext: nextCursor !== null,
  nextCursor,
});
const notificationHook = (r) => {
  const childApi = queuedApi();
  const children = r.observe(
    r.load('src/query/options.ts').serverOptions(r.scope(), 'children', [], childApi.request)
  );
  const list = r.observe(
    r.load('src/query/notifications.ts').notificationListOptions(r.scope()),
    true
  );
  const runner = hookHarness('src/hooks/notifications/useNotificationList.ts', {
    '@react-navigation/native': { useIsFocused: () => true },
    '@tanstack/react-query': { useInfiniteQuery: () => list.result },
    '../../query/client': r.load('src/query/client.ts'),
    '../../query/hooks': {
      useSessionScope: () => ({ ...r.scope(), authenticated: true }),
      useApiMutation: (fn) => fn,
    },
    '../../query/notifications': r.load('src/query/notifications.ts'),
    '../../query/resources': { useChildrenQuery: () => children.result, useUnreadQuery: () => {} },
    '../../query/state': r.load('src/query/state.ts'),
  });
  runner.render();
  return { runner, childApi, children, list };
};

test('notification retry refetches a failed child query as well as notifications', async () => {
  const r = setup();
  const screen = notificationHook(r);
  await r.flush();
  r.calls.pages.calls[0].resolve(page([1]));
  screen.childApi.calls[0].reject(transient());
  await r.flush();
  screen.runner.render();
  assert.equal(screen.runner.result.loadError, true);
  screen.runner.result.loadInitial();
  await r.flush();
  assert.equal(screen.childApi.calls.length, 2);
  assert.equal(r.calls.pages.calls.length, 2);
  screen.childApi.calls[1].resolve([]);
  r.calls.pages.calls[1].resolve(page([1]));
  await r.flush();
  screen.runner.render();
  assert.equal(screen.runner.result.loadError, false);
  screen.runner.unmount();
});

test('notification pagination failure keeps the list and retries the failed cursor', async () => {
  const r = setup();
  const hook = notificationHook(r);
  await r.flush();
  hook.childApi.calls[0].resolve([]);
  r.calls.pages.calls[0].resolve(page([1], 2));
  await r.flush();
  hook.runner.render();
  const more = hook.runner.result.loadMore();
  await r.flush();
  r.calls.pages.calls[1].reject(transient());
  await more;
  hook.runner.render();
  assert.equal(hook.runner.result.loadError, false);
  assert.equal(hook.runner.result.refreshError, true);
  assert.equal(hook.runner.result.notifications.length, 1);
  const screen = hookHarness('app/notifications/index.tsx', {
    ...ui(r),
    'expo-router': {},
    '../../src/components/common/HeaderMenuButton': {},
    '../../src/components/common/ChildFilterBar': {},
    '../../src/styles/notifications/notifications': { default: {} },
    '../../src/hooks/notifications/useNotificationList': { default: () => hook.runner.result },
    '../../src/utils/date': { fmt: () => '2026-11-22' },
  });
  screen.render();
  const list = elements(screen.result, 'FlatList')[0];
  assert.equal(list.props.data.length, 2);
  elements(list.props.ListFooterComponent, 'QueryNotice')[0].props.onRetry();
  await r.flush();
  assert.equal(r.calls.pages.calls[2].args[0].cursor, 2);
  r.calls.pages.calls[2].resolve(page([]));
  await r.flush();
  hook.runner.render();
  assert.equal(hook.runner.result.refreshError, false);
  screen.unmount();
  hook.runner.unmount();
});
