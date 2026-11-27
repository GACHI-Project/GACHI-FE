/* eslint-env node */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const queuedApi = () => {
  const calls = [];
  return {
    calls,
    request: (...args) => {
      const pending = deferred();
      calls.push({ args, ...pending });
      return pending.promise;
    },
  };
};

// Execute the production hook with controlled renders, effects, focus and timers.
const hookHarness = (file, mocks, globals = {}, exportName = 'default', sourceFiles = []) => {
  const cells = [];
  const timers = new Map();
  const effectCleanups = new Map();
  let cursor = 0;
  let timerId = 0;
  let effects = [];
  let layoutEffects = [];
  let dirty = false;
  let disposed = false;
  let args = [];
  let result;
  let focused = true;
  const focusEffects = new Map();
  let postUnmountUpdates = 0;
  let readingRenderValue = false;
  const same = (a, b) =>
    a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const memo = (fn, deps) => {
    const index = cursor;
    cursor += 1;
    if (!cells[index] || !same(cells[index].deps, deps)) cells[index] = { deps, value: fn() };
    return cells[index].value;
  };
  const scheduleEffect = (callback, deps, queue) => {
    const index = cursor;
    cursor += 1;
    if (!cells[index] || !same(cells[index].deps, deps)) {
      const cell = { deps };
      cells[index] = cell;
      queue.push(() => {
        const cleanup = effectCleanups.get(index);
        effectCleanups.delete(index);
        cleanup?.();
        const nextCleanup = callback();
        if (nextCleanup) effectCleanups.set(index, nextCleanup);
      });
    }
  };
  const react = {
    useState: (initial) => {
      const index = cursor;
      cursor += 1;
      if (!cells[index]) {
        const cell = { value: typeof initial === 'function' ? initial() : initial };
        cell.set = (value) => {
          if (disposed) {
            postUnmountUpdates += 1;
            return;
          }
          const next = typeof value === 'function' ? value(cell.value) : value;
          if (!Object.is(cell.value, next)) {
            cell.value = next;
            dirty = true;
          }
        };
        cells[index] = cell;
      }
      return [cells[index].value, cells[index].set];
    },
    useRef: (initial) => {
      const index = cursor;
      cursor += 1;
      if (!cells[index]) {
        let value = initial;
        cells[index] = {
          get current() {
            if (readingRenderValue) throw new Error('Render-time value cannot read ref.current');
            return value;
          },
          set current(next) {
            if (readingRenderValue) throw new Error('Render-time value cannot write ref.current');
            value = next;
          },
        };
      }
      return cells[index];
    },
    useMemo: memo,
    useCallback: (callback, deps) => memo(() => callback, deps),
    useSyncExternalStore: (subscribe, getSnapshot) => {
      const snapshot = getSnapshot();
      const [instance] = react.useState(() => ({ snapshot, getSnapshot }));
      const [, update] = react.useState(0);
      const check = react.useCallback(() => {
        if (!Object.is(instance.snapshot, instance.getSnapshot())) update((value) => value + 1);
      }, [instance, update]);
      react.useEffect(() => {
        instance.snapshot = snapshot;
        instance.getSnapshot = getSnapshot;
        check();
      }, [instance, snapshot, getSnapshot, check]);
      react.useEffect(() => {
        const unsubscribe = subscribe(check);
        check();
        return unsubscribe;
      }, [subscribe, check]);
      return snapshot;
    },
    useEffect: (callback, deps) => scheduleEffect(callback, deps, effects),
    useLayoutEffect: (callback, deps) => scheduleEffect(callback, deps, layoutEffects),
  };
  const resolvedMocks = typeof mocks === 'function' ? mocks(react, () => focused) : mocks;
  const imports = {
    ...resolvedMocks,
    react,
    'expo-router': {
      ...resolvedMocks['expo-router'],
      useFocusEffect: (callback) =>
        react.useEffect(() => {
          const effect = { callback };
          focusEffects.set(effect, focused ? callback() : undefined);
          return () => {
            focusEffects.get(effect)?.();
            focusEffects.delete(effect);
          };
        }, [callback]),
    },
  };
  const sources = new Set(sourceFiles.map((source) => path.resolve(__dirname, '../..', source)));
  const modules = new Map();
  const load = (filename) => {
    if (modules.has(filename)) return modules.get(filename);
    const exports = {};
    modules.set(filename, exports);
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      fileName: filename,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
      },
    });
    vm.runInNewContext(
      outputText,
      {
        ...globals,
        exports,
        require: (name) => {
          if (name.startsWith('.')) {
            const source = path.resolve(path.dirname(filename), `${name}.ts`);
            if (sources.has(source)) return load(source);
          }
          if (!(name in imports)) throw new Error(`Unexpected module: ${name}`);
          return imports[name];
        },
        setTimeout: (callback) => {
          timerId += 1;
          timers.set(timerId, callback);
          return timerId;
        },
        clearTimeout: (id) => timers.delete(id),
      },
      { filename }
    );
    return exports;
  };
  const exports = load(path.resolve(__dirname, '../..', file));
  const renderPhase = (flushEffects, ...nextArgs) => {
    if (nextArgs.length) args = nextArgs;
    let iterations = 0;
    do {
      dirty = false;
      cursor = 0;
      result = exports[exportName](...args);
      const committedEffects = layoutEffects;
      layoutEffects = [];
      committedEffects.forEach((callback) => callback());
      if (flushEffects) {
        const pendingEffects = effects;
        effects = [];
        pendingEffects.forEach((callback) => callback());
      }
      iterations += 1;
      if (iterations > 20) throw new Error('Hook did not settle');
    } while (dirty);
    return result;
  };
  const render = (...nextArgs) => renderPhase(true, ...nextArgs);
  return {
    render,
    renderBeforeEffects: (...nextArgs) => renderPhase(false, ...nextArgs),
    renderValue: (read) => {
      readingRenderValue = true;
      try {
        return read(result);
      } finally {
        readingRenderValue = false;
      }
    },
    get result() {
      return result;
    },
    get postUnmountUpdates() {
      return postUnmountUpdates;
    },
    flush: async () => {
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      if (dirty && !disposed) render();
    },
    runTimers: () => {
      const callbacks = [...timers.values()];
      timers.clear();
      callbacks.forEach((callback) => callback());
      if (dirty) render();
    },
    blur: () => {
      if (!focused) return;
      focused = false;
      focusEffects.forEach((cleanup, effect) => {
        cleanup?.();
        focusEffects.set(effect, undefined);
      });
      render();
    },
    focus: () => {
      if (focused) return;
      const returningEffects = [...focusEffects.keys()];
      focused = true;
      render();
      returningEffects.forEach((effect) => {
        if (focusEffects.has(effect)) focusEffects.set(effect, effect.callback());
      });
      if (dirty) render();
    },
    unmount: () => {
      if (disposed) return;
      effects = [];
      layoutEffects = [];
      effectCleanups.forEach((cleanup) => cleanup());
      effectCleanups.clear();
      disposed = true;
    },
  };
};

module.exports = { hookHarness, queuedApi };
