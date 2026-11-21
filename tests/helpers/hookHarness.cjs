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
const hookHarness = (file, mocks, globals = {}, exportName = 'default') => {
  const cells = [];
  const timers = new Map();
  let cursor = 0;
  let timerId = 0;
  let effects = [];
  let dirty = false;
  let disposed = false;
  let args = [];
  let result;
  let focused = true;
  let focusCallback;
  let focusCleanup;
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
      const [, update] = react.useState(0);
      react.useEffect(() => subscribe(() => update((value) => value + 1)), [subscribe]);
      return getSnapshot();
    },
    useEffect: (callback, deps) => {
      const index = cursor;
      cursor += 1;
      if (!cells[index] || !same(cells[index].deps, deps)) {
        const previous = cells[index];
        const cell = { deps };
        cells[index] = cell;
        effects.push(() => {
          previous?.cleanup?.();
          cell.cleanup = callback();
        });
      }
    },
  };
  const imports = {
    ...mocks,
    react,
    'expo-router': {
      ...mocks['expo-router'],
      useFocusEffect: (callback) =>
        react.useEffect(() => {
          focusCallback = callback;
          if (focused) focusCleanup = callback();
          return () => {
            focusCleanup?.();
            focusCleanup = undefined;
          };
        }, [callback]),
    },
  };
  const exports = {};
  const filename = path.resolve(__dirname, '../..', file);
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
  const render = (...nextArgs) => {
    if (nextArgs.length) args = nextArgs;
    let iterations = 0;
    do {
      dirty = false;
      cursor = 0;
      effects = [];
      result = exports[exportName](...args);
      effects.forEach((effect) => effect());
      iterations += 1;
      if (iterations > 20) throw new Error('Hook did not settle');
    } while (dirty);
    return result;
  };
  return {
    render,
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
      focused = false;
      focusCleanup?.();
      focusCleanup = undefined;
    },
    focus: () => {
      focused = true;
      focusCleanup = focusCallback?.();
      if (dirty) render();
    },
    unmount: () => {
      cells.forEach((cell) => cell.cleanup?.());
      disposed = true;
    },
  };
};

module.exports = { hookHarness, queuedApi };
