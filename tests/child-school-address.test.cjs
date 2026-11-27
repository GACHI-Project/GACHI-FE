/* eslint-env node */
const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const { QueryObserver } = require('@tanstack/react-query');
const { hookHarness, queuedApi } = require('./helpers/hookHarness.cjs');
const { queryRuntime } = require('./helpers/queryRuntime.cjs');

const cleanups = new Set();
afterEach(() => {
  [...cleanups].reverse().forEach((cleanup) => cleanup());
  cleanups.clear();
});

const setup = () => {
  const api = queuedApi();
  const runtime = queryRuntime({ client: { apiClient: { get: api.request } } });
  cleanups.add(runtime.dispose);
  return { api, runtime };
};
const school = (schoolCode = 'S1', officeCode = 'O1', roadAddress = '') => ({
  schoolCode,
  officeCode,
  schoolName: 'Same-name school',
  englishSchoolName: '',
  schoolKind: '',
  officeName: '',
  roadAddress,
  locationName: '',
});
const child = (overrides = {}) => ({
  id: 1,
  name: 'Child',
  schoolName: 'Same-name school',
  schoolCode: 'S1',
  officeCode: 'O1',
  grade: 2,
  className: '3',
  colorCode: '#2BAEE0',
  createdAt: '2026-11-25',
  ...overrides,
});
const response = (...schools) => ({ data: { result: { schools } } });
const elements = (tree, type) => {
  if (Array.isArray(tree)) return tree.flatMap((item) => elements(item, type));
  if (!tree || typeof tree !== 'object') return [];
  return [...(tree.type === type ? [tree] : []), ...elements(tree.props?.children, type)];
};

const registerHarness = (exportName = 'isChildComplete', query = { data: [] }, schoolApi = {}) => {
  const queries = queryRuntime({ school: schoolApi });
  cleanups.add(queries.dispose);
  const jsx = (type, props) => ({ type, props });
  const runner = hookHarness(
    'app/(auth)/register/child.tsx',
    {
      'react/jsx-runtime': { jsx, jsxs: jsx },
      'react-native': {
        View: 'View',
        Text: 'Text',
        TouchableOpacity: 'TouchableOpacity',
        ScrollView: 'ScrollView',
        TextInput: 'TextInput',
        ActivityIndicator: 'ActivityIndicator',
      },
      '@expo/vector-icons': {},
      'react-i18next': { useTranslation: () => ({ t: (key) => key }) },
      '../../../src/api/school': schoolApi,
      '../../../src/components/common/Button': {},
      '../../../src/components/common/StepHeader': {},
      '../../../src/constants/child': {},
      '../../../src/constants/colors': { default: { text: {}, primary: {}, gray: {} } },
      '../../../src/query/hooks': {
        useDebouncedValue: (value) => value,
        useServerQuery: typeof query === 'function' ? query : () => query,
      },
      '../../../src/query/schools': queries.load('src/query/schools.ts'),
      '../../../src/store/registerStore': {},
      '../../../src/styles/register/child': { default: {} },
      '../../../src/styles/register/childCard': { default: {} },
    },
    {},
    exportName
  );
  cleanups.add(runner.unmount);
  return runner;
};

const editSheet = (runtime, initialChild = child(), isNew = false, handlers = {}) => {
  const saved = [];
  const deleted = [];
  const closed = [];
  const alerts = [];
  const validation = registerHarness();
  const { toChildInfo } = runtime.load('src/utils/child.ts');
  const props = {
    visible: true,
    child: initialChild ? toChildInfo(initialChild) : null,
    isNew,
    onClose: () => closed.push(props.child?.id),
    onDelete: (id) => {
      deleted.push(id);
      return handlers.delete?.(id);
    },
    onSave: (value) => {
      saved.push(value);
      return handlers.save?.(value);
    },
  };
  class Value {
    setValue(value) {
      this.value = value;
    }
  }
  const animate = () => ({ start: () => {} });
  const jsx = (type, nodeProps) => ({ type, props: nodeProps });
  const runner = hookHarness(
    'src/components/profile/ChildEditSheet.tsx',
    (react) => ({
      'react/jsx-runtime': { jsx, jsxs: jsx },
      'react-native': {
        ...Object.fromEntries(
          [
            'View',
            'Text',
            'Modal',
            'ScrollView',
            'TouchableOpacity',
            'TouchableWithoutFeedback',
            'ActivityIndicator',
          ].map((name) => [name, name])
        ),
        StyleSheet: { create: (styles) => styles },
        Animated: { Value, timing: animate, parallel: animate },
        Keyboard: { dismiss: () => {} },
        Alert: { alert: (...args) => alerts.push(args) },
      },
      '@expo/vector-icons': {},
      'react-i18next': { useTranslation: () => ({ t: (key) => key }) },
      'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 0 }) },
      '../common/ConfirmModal': { default: 'ConfirmModal' },
      '../../../app/(auth)/register/child': {
        ChildCard: 'ChildCard',
        isChildComplete: (value) => validation.render(value),
      },
      '../../constants/colors': runtime.load('src/constants/colors.ts'),
      '../../constants/fonts': runtime.load('src/constants/fonts.ts'),
      '../../constants/layout': runtime.load('src/constants/layout.ts'),
      '../../query/client': runtime.load('src/query/client.ts'),
      '../../query/hooks': { useSessionScope: runtime.scope },
      '../../query/schools': runtime.load('src/query/schools.ts'),
      '../../utils/authSession': runtime.session,
      '@tanstack/react-query': {
        useQuery: (options, client) => {
          const defaults = client.defaultQueryOptions({
            ...options,
            _optimisticResults: 'optimistic',
          });
          const [observer] = react.useState(() => new QueryObserver(client, defaults));
          const result = observer.getOptimisticResult(defaults);
          react.useEffect(() => observer.setOptions(defaults), [observer, defaults]);
          react.useSyncExternalStore(
            react.useCallback(
              (notify) => {
                const unsubscribe = observer.subscribe(notify);
                observer.updateResult();
                return unsubscribe;
              },
              [observer]
            ),
            () => observer.getCurrentResult()
          );
          return result;
        },
      },
    }),
    {},
    'default',
    ['src/hooks/profile/useSchoolAddress.ts']
  );
  cleanups.add(runner.unmount);
  runner.render(props);
  const button = () =>
    elements(runner.result, 'TouchableOpacity').find(
      (node) => node.props.accessibilityLabel === 'profile.childEdit.save'
    ).props;
  return {
    runner,
    saved,
    deleted,
    closed,
    alerts,
    card: () => elements(runner.result, 'ChildCard')[0].props,
    button,
    deleteButton: () =>
      elements(runner.result, 'TouchableOpacity').find(
        (node) => node.props.accessibilityLabel === 'profile.childEdit.delete'
      ).props,
    confirmation: () => elements(runner.result, 'ConfirmModal')[0].props,
    dismiss: () => elements(runner.result, 'Modal')[0].props.onRequestClose(),
    form: () => elements(runner.result, 'View').find((node) => node.props.pointerEvents).props,
    close: () => {
      props.visible = false;
      runner.render(props);
    },
    open: (next = initialChild, beforeEffects = false) => {
      props.visible = true;
      props.child = next ? toChildInfo(next) : null;
      if (beforeEffects) runner.renderBeforeEffects(props);
      else runner.render(props);
    },
  };
};

test('child mapping preserves server-provided addresses and optional legacy fields', () => {
  const { runtime } = setup();
  const { toChildInfo } = runtime.load('src/utils/child.ts');
  const mapped = toChildInfo(child({ roadAddress: 'Server address', locationName: 'Region' }));
  assert.equal(mapped.selectedSchool.roadAddress, 'Server address');
  assert.equal(mapped.selectedSchool.locationName, 'Region');
  const legacy = toChildInfo(child({ roadAddress: null, locationName: null, className: null }));
  assert.equal(legacy.selectedSchool.roadAddress, '');
  assert.equal(legacy.selectedSchool.locationName, '');
  assert.equal(legacy.className, '');
});

test('address lookup uses the maximum supported size and matches both school codes', async () => {
  const { runtime, api } = setup();
  const screen = editSheet(runtime);
  assert.equal(api.calls.length, 1);
  assert.equal(api.calls[0].args[0], '/api/v1/schools/search');
  assert.equal(api.calls[0].args[1].params.keyword, 'Same-name school');
  assert.equal(api.calls[0].args[1].params.size, 20);
  assert.ok(api.calls[0].args[1].signal instanceof AbortSignal);
  api.calls[0].resolve(
    response(
      school('S1', 'O2', 'Wrong office'),
      school('S2', 'O1', 'Wrong school'),
      school('S1', 'O1', 'Right address')
    )
  );
  await screen.runner.flush();
  assert.equal(screen.card().child.selectedSchool.roadAddress, 'Right address');
  assert.equal(screen.card().child.selectedSchool.schoolName, 'Same-name school');
  const picker = registerHarness('SchoolPicker');
  picker.render({ ...screen.card().child, onUpdate: () => {} });
  assert.ok(
    elements(picker.result, 'Text').some((text) => text.props.children === 'Right address')
  );
});

test('a provided address skips lookup and remains visible when reopening', () => {
  const { runtime, api } = setup();
  const screen = editSheet(runtime, child({ roadAddress: 'Server address' }));
  assert.equal(screen.card().child.selectedSchool.roadAddress, 'Server address');
  screen.close();
  screen.open(child({ roadAddress: 'Server address' }));
  assert.equal(screen.card().child.selectedSchool.roadAddress, 'Server address');
  assert.equal(api.calls.length, 0);
});

test('concurrent children at the same school share a request and reuse the address after reopening', async () => {
  const { runtime, api } = setup();
  const first = editSheet(runtime);
  const second = editSheet(runtime, child({ id: 2, name: 'Sibling' }));
  assert.equal(api.calls.length, 1);
  api.calls[0].resolve(response(school('S1', 'O1', 'Shared address')));
  await first.runner.flush();
  await second.runner.flush();
  assert.equal(first.card().child.selectedSchool.roadAddress, 'Shared address');
  assert.equal(second.card().child.selectedSchool.roadAddress, 'Shared address');
  first.close();
  first.open();
  assert.equal(first.card().child.selectedSchool.roadAddress, 'Shared address');
  const remounted = editSheet(runtime);
  assert.equal(remounted.card().child.selectedSchool.roadAddress, 'Shared address');
  assert.equal(api.calls.length, 1);
});

test('a fresh app cache can reconstruct the address from persisted child codes', async () => {
  const first = setup();
  const before = editSheet(first.runtime);
  first.api.calls[0].resolve(response(school('S1', 'O1', 'Address')));
  await before.runner.flush();
  assert.equal(before.card().child.selectedSchool.roadAddress, 'Address');
  const restarted = setup();
  const after = editSheet(restarted.runtime);
  assert.equal(restarted.api.calls.length, 1);
  restarted.api.calls[0].resolve(response(school('S1', 'O1', 'Address')));
  await after.runner.flush();
  assert.equal(after.card().child.selectedSchool.roadAddress, 'Address');
});

['error', 'no match'].forEach((failure) => {
  test(`address lookup ${failure} preserves edits and allows saving`, async () => {
    const { runtime, api } = setup();
    const screen = editSheet(runtime, child({ locationName: 'Known region' }));
    screen.card().onUpdate({ name: 'Edited name', grade: 4, className: '7' });
    screen.runner.render();
    assert.equal(screen.button().disabled, false);
    if (failure === 'error') api.calls[0].reject(new Error('Lookup failed'));
    else api.calls[0].resolve(response(school('S2', 'O1', 'Unrelated address')));
    await screen.runner.flush();
    assert.equal(screen.card().child.name, 'Edited name');
    assert.equal(screen.card().child.selectedSchool.schoolName, 'Same-name school');
    assert.equal(screen.card().child.selectedSchool.locationName, 'Known region');
    assert.equal(screen.card().child.selectedSchool.roadAddress, '');
    assert.equal(screen.button().disabled, false);
    screen.button().onPress();
    assert.equal(screen.saved[0].name, 'Edited name');
    assert.equal(screen.saved[0].grade, 4);
    assert.equal(screen.saved[0].className, '7');
    assert.equal(screen.saved[0].selectedSchool.schoolCode, 'S1');
  });
});

test('a late address cannot overwrite a changed school or current form values', async () => {
  const { runtime, api } = setup();
  const screen = editSheet(runtime);
  screen.card().onUpdate({ selectedSchool: school('S2', 'O2'), name: 'Edited', className: '8' });
  screen.runner.render();
  assert.equal(api.calls.length, 2);
  assert.equal(api.calls[0].args[1].signal.aborted, true);
  api.calls[1].resolve(response(school('S2', 'O2', 'New school address')));
  await screen.runner.flush();
  assert.equal(screen.card().child.selectedSchool.roadAddress, 'New school address');
  api.calls[0].resolve(response(school('S1', 'O1', 'Old school address')));
  await screen.runner.flush();
  assert.equal(screen.card().child.selectedSchool.roadAddress, 'New school address');
  assert.equal(screen.card().child.name, 'Edited');
  assert.equal(screen.card().child.className, '8');
  screen.button().onPress();
  assert.equal(screen.saved[0].selectedSchool.schoolCode, 'S2');
  assert.equal(screen.saved[0].selectedSchool.officeCode, 'O2');
});

test('clearing a school ignores the late result and a newly selected complete school needs no lookup', async () => {
  const { runtime, api } = setup();
  const screen = editSheet(runtime);
  screen.card().onUpdate({ selectedSchool: null, schoolQuery: '', className: null });
  screen.runner.render();
  api.calls[0].resolve(response(school('S1', 'O1', 'Old address')));
  await screen.runner.flush();
  assert.equal(screen.card().child.selectedSchool, null);
  assert.equal(screen.button().disabled, true);
  screen
    .card()
    .onUpdate({ selectedSchool: school('S2', 'O2', 'Selected address'), className: '5' });
  screen.runner.render();
  assert.equal(screen.card().child.selectedSchool.roadAddress, 'Selected address');
  assert.equal(screen.button().disabled, false);
  assert.equal(api.calls.length, 1);
  screen.close();
  screen.open(child({ schoolCode: 'S2', officeCode: 'O2', className: '5' }));
  assert.equal(screen.card().child.selectedSchool.roadAddress, 'Selected address');
  assert.equal(api.calls.length, 1);
});

test('adding a child keeps validation and saving independent of address lookup', () => {
  const { runtime, api } = setup();
  const screen = editSheet(
    runtime,
    child({ name: '', schoolName: '', schoolCode: '', officeCode: '', className: null }),
    true
  );
  assert.equal(api.calls.length, 0);
  assert.equal(screen.button().disabled, true);
  screen.card().onUpdate({
    name: 'New child',
    selectedSchool: school('S2', 'O2', 'Selected address'),
    className: '1',
  });
  screen.runner.render();
  assert.equal(screen.button().disabled, false);
  screen.button().onPress();
  assert.equal(screen.saved[0].name, 'New child');
  assert.equal(screen.saved[0].selectedSchool.roadAddress, 'Selected address');
  assert.equal(api.calls.length, 0);
});

test('unmounting cancels the address request without updating the closed form', async () => {
  const { runtime, api } = setup();
  const screen = editSheet(runtime);
  screen.runner.unmount();
  assert.equal(api.calls[0].args[1].signal.aborted, true);
  api.calls[0].resolve(response(school('S1', 'O1', 'Late address')));
  await screen.runner.flush();
  assert.equal(screen.runner.postUnmountUpdates, 0);
});

test('the profile prefetches school data before opening the sheet without blocking its content', async () => {
  const { runtime, api } = setup();
  const children = [child()];
  const profile = hookHarness('src/hooks/profile/useProfileData.ts', {
    '../../query/hooks': { useSessionScope: runtime.scope },
    '../../query/resources': {
      useChildrenQuery: () => ({ data: children, isLoading: false }),
      useProfileQuery: () => ({ data: { name: 'Parent' }, isLoading: false }),
    },
    '../../query/schools': runtime.load('src/query/schools.ts'),
  });
  cleanups.add(profile.unmount);
  profile.render();
  assert.equal(profile.result.isLoading, false);
  assert.equal(profile.result.children[0].name, 'Child');
  assert.equal(api.calls.length, 2);
  assert.equal(api.calls[0].args[0], '/api/v1/schools/search');
  assert.equal(api.calls[1].args[0], '/api/v1/schools/classes');
  assert.equal(api.calls[1].args[1].params.grade, 2);
  api.calls[0].resolve(response(school('S1', 'O1', 'Prefetched address')));
  api.calls[1].resolve({
    data: { result: { classes: [{ academicYear: '2026', grade: 2, className: '3' }] } },
  });
  await runtime.flush();
  const sheet = editSheet(runtime);
  assert.equal(sheet.card().child.selectedSchool.roadAddress, 'Prefetched address');
  const { serverOptions } = runtime.load('src/query/options.ts');
  let view;
  const picker = registerHarness(
    'ClassPicker',
    (domain, params, fetch, options) => {
      const next = { ...serverOptions(runtime.scope(), domain, params, fetch), ...options };
      if (!view) view = runtime.observe(next);
      else view.setOptions(next);
      return view.result;
    },
    runtime.load('src/api/school.ts')
  );
  picker.render({ selectedSchool: school(), grade: 2, className: '3', onUpdate: () => {} });
  assert.equal(elements(picker.result, 'ActivityIndicator').length, 0);
  assert.ok(elements(picker.result, 'Text').some((text) => text.props.children === '3'));
  assert.equal(api.calls.length, 2);
});

test('prefetches share pending requests and fresh data for siblings at the same school and grade', async () => {
  const { runtime, api } = setup();
  const { prefetchChildSchoolData } = runtime.load('src/query/schools.ts');
  const children = [child(), child({ id: 2, name: 'Sibling' })];
  const first = prefetchChildSchoolData(runtime.scope(), children);
  const repeated = prefetchChildSchoolData(runtime.scope(), children);
  assert.equal(api.calls.length, 2);
  api.calls[0].resolve(response(school('S1', 'O1', 'Address')));
  api.calls[1].resolve({ data: { result: { classes: [] } } });
  await Promise.all([first, repeated]);
  await prefetchChildSchoolData(runtime.scope(), children);
  assert.equal(api.calls.length, 2);
});

test('prefetch failure does not block editing or saving the known child details', async () => {
  const { runtime, api } = setup();
  const pending = runtime
    .load('src/query/schools.ts')
    .prefetchChildSchoolData(runtime.scope(), [child()]);
  const sheet = editSheet(runtime);
  assert.equal(api.calls.length, 2);
  assert.equal(sheet.card().child.className, '3');
  assert.equal(sheet.button().disabled, false);
  sheet.button().onPress();
  assert.equal(sheet.saved[0].className, '3');
  api.calls[0].reject(new Error('Address unavailable'));
  api.calls[1].reject(new Error('Classes unavailable'));
  await pending;
  await sheet.runner.flush();
  assert.equal(sheet.card().child.className, '3');
  assert.equal(sheet.button().disabled, false);
});

test('the saved class remains visible while its list is loading and is retained after loading', () => {
  const query = { isLoading: true, isSuccess: false, data: undefined };
  const picker = registerHarness('ClassPicker', query);
  const updates = [];
  const props = {
    selectedSchool: school(),
    grade: 2,
    className: '3',
    onUpdate: (value) => updates.push(value),
  };
  picker.render(props);
  assert.ok(elements(picker.result, 'Text').some((text) => text.props.children === '3'));
  assert.equal(elements(picker.result, 'ActivityIndicator').length, 1);
  assert.equal(updates.length, 0);
  query.isLoading = false;
  query.isSuccess = true;
  query.data = [
    { academicYear: '2026', className: '3' },
    { academicYear: '2026', className: '4' },
  ];
  picker.render(props);
  assert.equal(elements(picker.result, 'ActivityIndicator').length, 0);
  assert.equal(elements(picker.result, 'TouchableOpacity').length, 2);
  assert.equal(updates.length, 0);
});

const startAction = (screen, kind) => {
  if (kind === 'save') return screen.button().onPress();
  screen.deleteButton().onPress();
  screen.runner.render();
  assert.equal(screen.confirmation().visible, true);
  return screen.confirmation().onConfirm();
};

test('saving immediately guards double taps, deletion, edits and dismissal until completion', async () => {
  const { runtime } = setup();
  const write = queuedApi();
  const screen = editSheet(runtime, child({ roadAddress: 'Address' }), false, {
    save: write.request,
  });
  const save = screen.button().onPress;
  const update = screen.card().onUpdate;
  const confirmDelete = screen.confirmation().onConfirm;
  const pending = save();
  save();
  confirmDelete();
  update({ name: 'Blocked edit' });
  screen.dismiss();
  screen.runner.render();
  assert.equal(write.calls.length, 1);
  assert.equal(screen.deleted.length, 0);
  assert.equal(screen.closed.length, 0);
  assert.equal(screen.card().child.name, 'Child');
  assert.equal(screen.button().disabled, true);
  assert.equal(screen.deleteButton().disabled, true);
  assert.equal(screen.form().pointerEvents, 'none');
  assert.equal(screen.button().accessibilityState.busy, true);
  write.calls[0].resolve();
  await pending;
  await screen.runner.flush();
  assert.deepEqual(screen.closed, ['1']);
  assert.equal(screen.alerts.length, 0);
  assert.equal(screen.form().pointerEvents, 'auto');
});

['save', 'delete'].forEach((kind) => {
  test(`a failed ${kind} retains the draft and allows retrying`, async () => {
    const { runtime } = setup();
    const write = queuedApi();
    const screen = editSheet(runtime, child({ roadAddress: 'Address' }), false, {
      [kind]: write.request,
    });
    screen.card().onUpdate({ name: 'Edited', className: '8' });
    screen.runner.render();
    const pending = startAction(screen, kind);
    screen.runner.render();
    assert.equal(screen.button().disabled, true);
    assert.equal(screen.deleteButton().disabled, true);
    if (kind === 'delete') {
      assert.equal(screen.confirmation().visible, false);
      screen.confirmation().onConfirm();
      screen.button().onPress();
      assert.equal(write.calls.length, 1);
      assert.equal(screen.saved.length, 0);
    }
    write.calls[0].reject(new Error('Write failed'));
    await pending;
    await screen.runner.flush();
    assert.equal(screen.closed.length, 0);
    assert.equal(screen.alerts.length, 1);
    assert.equal(
      screen.alerts[0][1],
      `profile.childEdit.${kind === 'save' ? 'update' : 'delete'}Failed`
    );
    assert.equal(screen.card().child.name, 'Edited');
    assert.equal(screen.card().child.className, '8');
    assert.equal(screen.button().disabled, false);
    assert.equal(screen.deleteButton().disabled, false);
    assert.equal(screen.form().pointerEvents, 'auto');
    const retry = startAction(screen, kind);
    assert.equal(write.calls.length, 2);
    write.calls[1].resolve();
    await retry;
    await screen.runner.flush();
    assert.deepEqual(screen.closed, ['1']);
  });

  ['success', 'failure'].forEach((outcome) => {
    test(`an old ${kind} ${outcome} is ignored after another child commits before passive effects`, async () => {
      const { runtime } = setup();
      const write = queuedApi();
      const screen = editSheet(runtime, child({ roadAddress: 'Address' }), false, {
        [kind]: write.request,
      });
      const pending = startAction(screen, kind);
      screen.open(child({ id: 2, name: 'Second child', roadAddress: 'Address' }), true);
      if (outcome === 'success') write.calls[0].resolve();
      else write.calls[0].reject(new Error('Old failure'));
      await pending;
      assert.equal(screen.closed.length, 0);
      assert.equal(screen.alerts.length, 0);
      screen.runner.render();
      assert.equal(screen.card().child.id, '2');
      assert.equal(screen.button().disabled, false);
    });

    test(`an old ${kind} ${outcome} cannot close or unlock a newer child's operation`, async () => {
      const { runtime } = setup();
      const write = queuedApi();
      const screen = editSheet(runtime, child({ roadAddress: 'Address' }), false, {
        [kind]: write.request,
      });
      const old = startAction(screen, kind);
      screen.open(child({ id: 2, name: 'Second child', roadAddress: 'Address' }));
      const current = startAction(screen, kind);
      if (outcome === 'success') write.calls[0].resolve();
      else write.calls[0].reject(new Error('Old failure'));
      await old;
      await screen.runner.flush();
      assert.equal(screen.closed.length, 0);
      assert.equal(screen.alerts.length, 0);
      assert.equal(screen.card().child.id, '2');
      assert.equal(screen.button().disabled, true);
      assert.equal(screen.form().pointerEvents, 'none');
      write.calls[1].resolve();
      await current;
      await screen.runner.flush();
      assert.deepEqual(screen.closed, ['2']);
    });
  });
});

test('reopening the same child invalidates an old completion and old event handlers', async () => {
  const { runtime } = setup();
  const write = queuedApi();
  const screen = editSheet(runtime, child({ roadAddress: 'Address' }), false, {
    save: write.request,
  });
  const save = screen.button().onPress;
  const pending = save();
  screen.close();
  screen.open();
  await save();
  assert.equal(write.calls.length, 1);
  write.calls[0].resolve();
  await pending;
  await screen.runner.flush();
  assert.equal(screen.closed.length, 0);
  assert.equal(screen.button().disabled, false);
});

test('unmounting or changing accounts prevents pending operations from closing or alerting', async () => {
  const first = setup();
  const write = queuedApi();
  const screen = editSheet(first.runtime, child({ roadAddress: 'Address' }), false, {
    save: write.request,
  });
  const pending = startAction(screen, 'save');
  screen.runner.unmount();
  write.calls[0].reject(new Error('Late failure'));
  await pending;
  assert.equal(screen.runner.postUnmountUpdates, 0);
  assert.equal(screen.alerts.length, 0);
  const second = setup();
  const current = editSheet(second.runtime, child({ roadAddress: 'Address' }), false, {
    save: write.request,
  });
  const next = startAction(current, 'save');
  second.runtime.session.invalidateSession();
  write.calls[1].resolve();
  await next;
  await current.runner.flush();
  assert.equal(current.closed.length, 0);
  assert.equal(current.alerts.length, 0);
});

test('shared school conditions skip invalid identities and grades without blocking valid class lookups', async () => {
  const { runtime, api } = setup();
  const { prefetchChildSchoolData, cacheSchoolDetails } = runtime.load('src/query/schools.ts');
  await prefetchChildSchoolData(runtime.scope(), [
    child({ schoolCode: '' }),
    child({ officeCode: '' }),
    child({ schoolName: 'X', grade: 0 }),
    child({ schoolName: 'X'.repeat(51), grade: 7 }),
  ]);
  assert.equal(api.calls.length, 0);
  const validClass = prefetchChildSchoolData(runtime.scope(), [child({ schoolName: 'X' })]);
  assert.equal(api.calls.length, 1);
  assert.equal(api.calls[0].args[0], '/api/v1/schools/classes');
  api.calls[0].resolve({ data: { result: { classes: [] } } });
  await validClass;
  const oldScope = runtime.scope();
  runtime.session.invalidateSession();
  cacheSchoolDetails(oldScope, school('S1', 'O1', 'Old address'));
  assert.equal(runtime.client.getQueryCache().getAll().length, 0);
});

const profileScreen = (runtime, write) => {
  const jsx = (type, props) => ({ type, props });
  const runner = hookHarness('app/(tabs)/profile.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': Object.fromEntries(
      ['View', 'Text', 'ScrollView', 'TouchableOpacity', 'Image', 'ActivityIndicator'].map(
        (name) => [name, name]
      )
    ),
    '@expo/vector-icons': {},
    'expo-router': {},
    'react-i18next': { useTranslation: () => ({ t: (key) => key, i18n: { language: 'ko' } }) },
    '../../src/auth/logout': {},
    '../../src/components/common/ConfirmModal': { default: 'ConfirmModal' },
    '../../src/components/common/Header': { default: 'Header' },
    '../../src/components/profile/ChildEditSheet': { default: 'ChildEditSheet' },
    '../../src/constants/child': runtime.load('src/constants/child.ts'),
    '../../src/constants/colors': runtime.load('src/constants/colors.ts'),
    '../../src/styles/profile/profile': { default: {} },
    '../../src/hooks/profile/useProfileData': {
      default: () => ({ children: [child(), child({ id: 2, name: 'Sibling' })] }),
    },
    '../../src/hooks/profile/useChildMutations': {
      default: () => ({ saveChild: write.request, removeChild: write.request }),
    },
    '../../src/utils/date': {},
    '../../src/utils/child': runtime.load('src/utils/child.ts'),
    '../../assets/social/google.png': {},
    '../../assets/social/kakao.png': {},
    '../../assets/icon.png': {},
  });
  cleanups.add(runner.unmount);
  runner.render();
  return {
    runner,
    sheet: () => elements(runner.result, 'ChildEditSheet')[0].props,
    open: (name) => {
      elements(runner.result, 'TouchableOpacity')
        .find((node) => elements(node, 'Text').some((text) => text.props.children === name))
        .props.onPress();
      runner.render();
    },
  };
};

['save', 'delete'].forEach((kind) => {
  ['success', 'failure'].forEach((outcome) => {
    test(`profile callbacks propagate ${kind} ${outcome} without dismissing another editor`, async () => {
      const { runtime } = setup();
      const write = queuedApi();
      const profile = profileScreen(runtime, write);
      profile.open('Child');
      const oldSheet = profile.sheet();
      const pending =
        kind === 'save' ? oldSheet.onSave(oldSheet.child) : oldSheet.onDelete(oldSheet.child.id);
      profile.open('Sibling');
      assert.equal(profile.sheet().child.id, '2');
      if (outcome === 'success') {
        write.calls[0].resolve();
        await pending;
      } else {
        write.calls[0].reject(new Error('Write failed'));
        await assert.rejects(pending, /Write failed/);
      }
      await profile.runner.flush();
      assert.equal(profile.sheet().visible, true);
      assert.equal(profile.sheet().child.id, '2');
      profile.sheet().onClose();
      profile.runner.render();
      assert.equal(profile.sheet().visible, false);
    });
  });
});
