/* eslint-env node */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const createLoader = (mocks = {}, globals = {}) => {
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
        jsx: ts.JsxEmit.ReactJSX,
      },
    });
    vm.runInNewContext(outputText, {
      ...globals,
      exports,
      require: (name) => {
        if (name in mocks) return mocks[name];
        if (name.startsWith('.')) {
          const resolved = path.resolve(path.dirname(filename), name);
          const extension = ['.ts', '.tsx'].find((ext) => fs.existsSync(resolved + ext));
          if (extension) return load(resolved + extension);
        }
        throw new Error(`Unexpected module: ${name}`);
      },
    });
    return exports;
  };
  return load;
};

const collect = (tree, predicate) => {
  if (Array.isArray(tree)) return tree.flatMap((child) => collect(child, predicate));
  if (!tree || typeof tree !== 'object') return [];
  return [...(predicate(tree) ? [tree] : []), ...collect(tree.props?.children, predicate)];
};

class AnimatedValue {
  constructor(value) {
    this.value = value;
  }

  setValue(value) {
    this.value = value;
  }
}

// Keep render, layout effects (before paint) and passive effects as separate phases.
const createViewer = (
  language,
  file = 'src/components/scan/result/PageImageViewerModal.tsx',
  mocks = {}
) => {
  const dimensions = { width: 320, height: 568, fontScale: 1.5 };
  const locale = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, `../src/i18n/locales/${language}.json`), 'utf8')
  );
  const translate = (key) => key.split('.').reduce((value, part) => value[part], locale);
  const cells = [];
  let cursor = 0;
  let dirty = false;
  let effects = [];
  let layoutEffects = [];
  const sameDependencies = (previous, next) =>
    previous &&
    next &&
    previous.length === next.length &&
    next.every((value, i) => Object.is(value, previous[i]));
  const scheduleEffect = (queue, callback, dependencies) => {
    const index = cursor;
    cursor += 1;
    const previous = cells[index];
    if (!previous || !sameDependencies(previous.dependencies, dependencies)) {
      const cell = { dependencies };
      cells[index] = cell;
      queue.push(() => {
        previous?.cleanup?.();
        cell.cleanup = callback();
      });
    }
  };
  const react = {
    useState: (initial) => {
      const index = cursor;
      cursor += 1;
      if (!(index in cells)) cells[index] = typeof initial === 'function' ? initial() : initial;
      return [
        cells[index],
        (update) => {
          const next = typeof update === 'function' ? update(cells[index]) : update;
          if (!Object.is(cells[index], next)) {
            cells[index] = next;
            dirty = true;
          }
        },
      ];
    },
    useRef: (initial) => {
      const index = cursor;
      cursor += 1;
      if (!(index in cells)) cells[index] = { current: initial };
      return cells[index];
    },
    useEffect: (callback, dependencies) => scheduleEffect(effects, callback, dependencies),
    useLayoutEffect: (callback, dependencies) =>
      scheduleEffect(layoutEffects, callback, dependencies),
  };
  const jsx = (type, props, key) => ({ type, props, key });
  const load = createLoader({
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': {
      ...Object.fromEntries(
        ['View', 'Text', 'Image', 'TouchableOpacity', 'Pressable', 'Modal', 'ScrollView'].map(
          (name) => [name, name]
        )
      ),
      StyleSheet: { create: (styles) => styles },
      useWindowDimensions: () => dimensions,
    },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 24, bottom: 16 }) },
    'react-native-gesture-handler': { GestureHandlerRootView: 'GestureHandlerRootView' },
    '@expo/vector-icons': { Ionicons: 'Ionicons' },
    'react-i18next': { useTranslation: () => ({ t: translate, i18n: { language } }) },
    '../../common/PinchZoomView': { default: 'PinchZoomView' },
    '../../common/Button': { PrimaryButton: 'PrimaryButton', SecondaryButton: 'SecondaryButton' },
    './TranslationOverlay': { default: 'TranslationOverlay' },
    ...mocks,
  });
  const Component = load(file).default;
  let props;
  let tree;
  let firstTree;
  let paintedTrees;
  const render = (updates = {}) => {
    props = { ...props, ...updates };
    let renders = 0;
    firstTree = undefined;
    paintedTrees = [];
    effects = [];
    do {
      cursor = 0;
      dirty = false;
      layoutEffects = [];
      tree = Component(props);
      if (renders === 0) firstTree = tree;
      layoutEffects.forEach((effect) => effect());
      if (!dirty) {
        paintedTrees.push(tree);
        const pending = effects;
        effects = [];
        pending.forEach((effect) => effect());
      }
      renders += 1;
      assert.ok(renders < 20, 'Viewer effects should settle');
    } while (dirty);
    return tree;
  };
  const press = (key) => {
    const button = collect(tree, (node) => node.props.label === translate(key))[0];
    assert.ok(button, `Missing action: ${key}`);
    button.props.onPress();
    render();
  };
  return {
    render,
    press,
    dimensions,
    get firstTree() {
      return firstTree;
    },
    get paintedTrees() {
      return paintedTrees;
    },
    get tree() {
      return tree;
    },
  };
};

const viewerKey = (key) => `scan.result.fullDoc.viewer.${key}`;
const load = createLoader();
const { getPageTranslationText } = load('src/utils/newsletterPage.ts');
const { estimateOverlayFontSize, MIN_OVERLAY_FONT_SIZE } = load('src/utils/translationOverlay.ts');

test('full translation uses the complete page text when it is available', () => {
  const text = 'First paragraph\n\nSecond paragraph';
  assert.equal(
    getPageTranslationText({ translatedText: text, blocks: [{ translatedText: 'partial' }] }),
    text
  );
});

test('block-only translation keeps every translated block in reading order without changing source data', () => {
  const blocks = [
    { blockNo: 3, translatedText: 'Last' },
    { blockNo: 1, translatedText: 'First' },
    { blockNo: 2, translatedText: '   ' },
    { blockNo: 4, originalText: 'Untranslated' },
  ];
  assert.equal(getPageTranslationText({ translatedText: ' ', blocks }), 'First\n\nLast');
  assert.deepEqual(
    blocks.map((block) => block.blockNo),
    [3, 1, 2, 4]
  );
  assert.equal(getPageTranslationText({}), '');
});

['ko', 'en', 'vi', 'zh'].forEach((language) => {
  test(`${language}: long block translations are reachable in full-text mode and image mode remains usable`, () => {
    const viewer = createViewer(language);
    const locale = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, `../src/i18n/locales/${language}.json`), 'utf8')
    );
    const text = `${locale.common.networkError} `.repeat(60);
    const page = { pageNo: 1, imageUrl: 'image', blocks: [{ blockNo: 1, translatedText: text }] };
    viewer.render({ visible: true, page, totalPages: 2, onClose: () => {} });
    viewer.press(viewerKey('readText'));
    const textScroll = collect(
      viewer.tree,
      (node) =>
        node.type === 'ScrollView' &&
        collect(node.props.children, (child) => child.props.selectable).length > 0
    )[0];
    assert.ok(textScroll, 'The full translation must be inside a ScrollView');
    const fullText = collect(
      textScroll,
      (node) => node.type === 'Text' && node.props.selectable
    )[0];
    assert.equal(fullText.props.children, text.trim());
    assert.equal(fullText.props.numberOfLines, undefined);
    viewer.press(viewerKey('viewImage'));
    assert.equal(collect(viewer.tree, (node) => node.type === 'TranslationOverlay').length, 1);
    const image = collect(viewer.tree, (node) => node.type === 'Image')[0];
    assert.ok(image, 'Returning to image mode must restore the original image');
    assert.equal(image.props.source.uri, page.imageUrl);
    assert.ok(estimateOverlayFontSize(text, 40, 12, 2) >= MIN_OVERLAY_FONT_SIZE);
  });
});

test('viewer fits portrait images into the measured space left by translated controls', () => {
  const viewer = createViewer('vi');
  viewer.render({
    visible: true,
    page: {
      pageNo: 1,
      imageUrl: 'image',
      imageWidth: 100,
      imageHeight: 200,
      translatedText: 'Text',
    },
    totalPages: 1,
  });
  const area = collect(viewer.tree, (node) => !!node.props.onLayout)[0];
  area.props.onLayout({ nativeEvent: { layout: { height: 100 } } });
  viewer.render();
  const image = collect(viewer.tree, (node) => node.type === 'PinchZoomView')[0];
  assert.equal(image.props.style.height, 100);
  assert.equal(image.props.style.width, 50);
  assert.ok(image.props.style.width * image.props.maxZoom >= (viewer.dimensions.width - 40) * 3);
  viewer.dimensions.width = 240;
  area.props.onLayout({ nativeEvent: { layout: { height: 600 } } });
  viewer.render();
  const resized = collect(viewer.tree, (node) => node.type === 'PinchZoomView')[0];
  assert.equal(resized.props.style.width, 200);
  assert.equal(resized.props.style.height, 400);
  assert.equal(resized.props.maxZoom, 3);
});

test('changing pages or reopening resets the viewer without showing the previous full translation', () => {
  const viewer = createViewer('en');
  viewer.render({
    visible: true,
    page: { pageNo: 1, imageUrl: 'first-image', translatedText: 'Previous page' },
    totalPages: 2,
  });
  viewer.press(viewerKey('readText'));
  viewer.render({ page: { pageNo: 2, imageUrl: 'next-image', translatedText: 'Next page' } });
  assert.equal(collect(viewer.firstTree, (node) => node.props.selectable).length, 1);
  viewer.paintedTrees.forEach((tree) =>
    assert.equal(collect(tree, (node) => node.props.selectable).length, 0)
  );
  assert.equal(collect(viewer.tree, (node) => node.props.selectable).length, 0);
  viewer.press(viewerKey('readText'));
  assert.equal(
    collect(viewer.tree, (node) => node.props.selectable)[0].props.children,
    'Next page'
  );
  viewer.render({ visible: false });
  viewer.render({ visible: true });
  assert.equal(collect(viewer.firstTree, (node) => node.props.selectable).length, 1);
  assert.ok(viewer.paintedTrees.length > 0);
  viewer.paintedTrees.forEach((tree) =>
    assert.equal(collect(tree, (node) => node.props.selectable).length, 0)
  );
  assert.equal(collect(viewer.tree, (node) => node.props.selectable).length, 0);
});

test('a text-only page opens directly in full-text mode without an empty image action', () => {
  const viewer = createViewer('en');
  viewer.render({
    visible: true,
    page: { pageNo: 1, translatedText: 'Complete translation' },
    totalPages: 1,
  });
  assert.equal(
    collect(viewer.firstTree, (node) => node.props.selectable)[0].props.children,
    'Complete translation'
  );
  assert.equal(
    collect(viewer.tree, (node) => node.type === 'PrimaryButton' || node.type === 'SecondaryButton')
      .length,
    0
  );
  assert.equal(collect(viewer.tree, (node) => node.type === 'PinchZoomView').length, 0);
});

test('untranslated blocks do not offer an overlay action or a full-text hint', () => {
  const viewer = createViewer('en');
  const page = {
    pageNo: 1,
    imageUrl: 'image',
    blocks: [{ blockNo: 1, originalText: 'Original', translatedText: '   ' }],
  };
  viewer.render({ visible: true, page, totalPages: 1 });
  assert.equal(
    collect(
      viewer.tree,
      (node) =>
        node.type === 'TranslationOverlay' ||
        node.type === 'SecondaryButton' ||
        node.type === 'PrimaryButton'
    ).length,
    0
  );
  assert.equal(
    collect(viewer.tree, (node) => node.type === 'Text' && typeof node.props.children === 'string')
      .length,
    1,
    'Only the page heading is shown, without an unusable full-text hint'
  );
  viewer.render({ page: { ...page, translatedText: 'Page translation' } });
  assert.equal(collect(viewer.tree, (node) => node.type === 'PrimaryButton').length, 1);
  assert.equal(collect(viewer.tree, (node) => node.type === 'SecondaryButton').length, 0);
});

test('overlay font fitting accounts for system font scaling and retains a readable lower bound', () => {
  const text = 'A translated paragraph that needs several lines';
  const normal = estimateOverlayFontSize(text, 200, 100, 1);
  const enlarged = estimateOverlayFontSize(text, 200, 100, 2);
  assert.ok(enlarged < normal);
  assert.ok(enlarged >= MIN_OVERLAY_FONT_SIZE);
  assert.equal(estimateOverlayFontSize(text.repeat(100), 0, 0, 2), MIN_OVERLAY_FONT_SIZE);
});

test('overlay font fitting reserves a line for every explicit line break', () => {
  assert.equal(estimateOverlayFontSize('a\nb', 200, 40, 1), 16.5);
  assert.equal(estimateOverlayFontSize('a\r\nb', 200, 40, 1), 16.5);
  assert.equal(estimateOverlayFontSize('a\nb\nc', 200, 30, 1), MIN_OVERLAY_FONT_SIZE);
});

test('overlay geometry changes remount measured text and refit before painting', () => {
  const overlay = createViewer('en', 'src/components/scan/result/TranslationOverlay.tsx');
  overlay.render({
    blocks: [
      { blockNo: 1, translatedText: 'Short text', box: { x: 0, y: 0, width: 1, height: 1 } },
    ],
    renderedWidth: 200,
    renderedHeight: 100,
  });
  let [text] = collect(overlay.tree, (node) => node.type === 'Text');
  const { key } = text;
  const initialFontSize = text.props.style[1].fontSize;
  text.props.onTextLayout({ nativeEvent: { lines: [{ y: 0, height: 110 }] } });
  overlay.render();
  [text] = collect(overlay.tree, (node) => node.type === 'Text');
  assert.ok(text.props.style[1].fontSize < initialFontSize);
  assert.equal(text.key, key, 'Font fitting must not reset the native Text node');
  overlay.render({ renderedHeight: 90 });
  [text] = collect(overlay.tree, (node) => node.type === 'Text');
  assert.notEqual(text.key, key, 'A resized box must force a new native text measurement');
  text.props.onTextLayout({ nativeEvent: { lines: [{ y: 0, height: 100 }] } });
  overlay.render();
  assert.ok(
    collect(overlay.tree, (node) => node.type === 'Text')[0].props.style[1].fontSize <
      initialFontSize
  );
});

test('all required social terms and the enabled next action share the scrollable body', () => {
  const destinations = [];
  const state = {
    authMethod: 'google',
    signupToken: 'signup',
    setSocialTermsAgreed: (value) => {
      state.agreed = value;
    },
  };
  const screen = createViewer('vi', 'app/(auth)/register/social-terms.tsx', {
    'expo-router': { router: { push: (route) => destinations.push(route) } },
    '../../../src/store/registerStore': { useRegisterStore: (select) => select(state) },
    '../../../src/components/common/StepHeader': { default: 'StepHeader' },
    '../../../src/components/common/Button': { PrimaryButton: 'PrimaryButton' },
  });
  screen.dimensions.height = 320;
  screen.dimensions.fontScale = 2;
  screen.render();
  const scroll = collect(screen.tree, (node) => node.type === 'ScrollView')[0];
  const rows = collect(
    scroll,
    (node) => typeof node.type === 'function' && node.type.name === 'TermsRow'
  );
  assert.equal(rows.length, 3);
  assert.equal(collect(scroll, (node) => node.type === 'PrimaryButton')[0].props.disabled, true);
  rows.forEach((row) => row.props.onToggle());
  screen.render();
  const next = collect(screen.tree, (node) => node.type === 'PrimaryButton')[0];
  assert.equal(next.props.disabled, false);
  next.props.onPress();
  assert.equal(state.agreed, true);
  assert.deepEqual(destinations, ['/(auth)/register/child']);
});

test('header menu bounds its scrolling items to the available screen height', () => {
  let selected;
  const menuItems = Array.from({ length: 8 }, (_, index) => ({
    label: `Long translated action ${index}`,
    onPress: () => {
      selected = index;
    },
  }));
  const menu = createViewer('vi', 'src/components/common/HeaderMenuButton.tsx');
  menu.dimensions.height = 320;
  menu.render({ icon: 'menu', menuItems });
  const trigger = collect(menu.tree, (node) => !!node.props.ref)[0];
  trigger.props.ref.current = { measure: (callback) => callback(0, 0, 30, 30, 0, 500) };
  trigger.props.onPress();
  menu.render();
  const scroll = collect(menu.tree, (node) => node.type === 'ScrollView')[0];
  const bounds = scroll.props.style[1];
  assert.ok(bounds.maxHeight > 0);
  assert.ok(bounds.top + bounds.maxHeight <= menu.dimensions.height - 16);
  const actions = collect(scroll, (node) => node.type === 'TouchableOpacity');
  assert.equal(actions.length, 8);
  actions[7].props.onPress();
  menu.render();
  assert.equal(selected, 7);
  assert.equal(collect(menu.tree, (node) => node.type === 'Modal')[0].props.visible, false);
});

test('scan detail actions remain scrollable while image zoom disables the content pager', () => {
  const invoked = [];
  const detail = createViewer('en', 'src/components/scan/ScanPageDetailModal.tsx', {
    'expo-image-manipulator': { manipulateAsync: () => {}, SaveFormat: { JPEG: 'jpeg' } },
    '../../hooks/scan/useModalClosed': { default: () => {} },
    '../common/PinchZoomView': { default: 'PinchZoomView' },
  });
  detail.render({
    visible: true,
    pages: [{ id: 'page-1', uri: 'image' }],
    currentIndex: 0,
    onClosed: () => {},
    onDelete: () => invoked.push('delete'),
    onRetake: () => invoked.push('retake'),
  });
  collect(detail.tree, (node) => node.type === 'PinchZoomView')[0].props.onZoomChange(true);
  detail.render();
  const disabled = collect(
    detail.tree,
    (node) => node.type === 'ScrollView' && node.props.scrollEnabled === false
  );
  assert.ok(disabled.length > 0);
  // The footer must be outside every scroll region disabled by image zoom.
  const footer = collect(
    detail.tree,
    (node) => node.type === 'ScrollView' && node.props.contentContainerStyle?.[0]?.paddingTop === 10
  )[0];
  assert.ok(footer);
  assert.notEqual(footer.props.scrollEnabled, false);
  assert.equal(collect(footer, (node) => node.type === 'TouchableOpacity').length, 2);
  collect(footer, (node) => node.type === 'TouchableOpacity').forEach((action) =>
    action.props.onPress()
  );
  assert.deepEqual(invoked, ['delete', 'retake']);
  disabled.forEach((scroll) => assert.equal(collect(scroll, (node) => node === footer).length, 0));
});

test('wrapped scan rows share the tallest measured height and remeasure after resizing', () => {
  const dimensions = { width: 320, height: 568, fontScale: 2 };
  const animation = { start: () => {} };
  const sheet = createViewer('vi', 'src/components/scan/ScanPageReviewSheet.tsx', {
    'react-native': {
      View: 'View',
      Text: 'Text',
      Modal: 'Modal',
      Pressable: 'Pressable',
      ScrollView: 'ScrollView',
      TouchableOpacity: 'TouchableOpacity',
      StyleSheet: { create: (styles) => styles },
      useWindowDimensions: () => dimensions,
      Dimensions: { get: () => dimensions },
      Animated: {
        Value: AnimatedValue,
        View: 'AnimatedView',
        timing: () => animation,
        spring: () => animation,
        parallel: () => animation,
      },
    },
    '../../hooks/scan/useModalClosed': { default: () => {} },
    './ScanPageCard': { default: 'ScanPageCard' },
    './useDragReorder': { reorderArray: () => {} },
  });
  sheet.render({
    visible: true,
    pages: Array.from({ length: 10 }, (_, index) => ({ id: String(index), uri: 'image' })),
    onClosed: () => {},
  });
  let rows = collect(sheet.tree, (node) => node.type === 'ScanPageCard');
  rows[0].props.onLayout({ nativeEvent: { layout: { height: 100 } } });
  rows[9].props.onLayout({ nativeEvent: { layout: { height: 160 } } });
  sheet.render();
  rows = collect(sheet.tree, (node) => node.type === 'ScanPageCard');
  assert.equal(rows.length, 10);
  rows.forEach((row) => {
    assert.equal(row.props.minHeight, 160);
    assert.ok(row.props.rowHeight > 160, 'Drag spacing must include the row gap');
  });
  const previousKey = rows[0].key;
  dimensions.width = 600;
  sheet.render();
  rows = collect(sheet.tree, (node) => node.type === 'ScanPageCard');
  assert.notEqual(rows[0].key, previousKey);
  rows[0].props.onLayout({ nativeEvent: { layout: { height: 100 } } });
  sheet.render();
  collect(sheet.tree, (node) => node.type === 'ScanPageCard').forEach((row) =>
    assert.equal(row.props.minHeight, 100)
  );
});

test('home card selection stays valid during child removal and resizes without a stale offset', () => {
  const cells = [];
  let cursor = 0;
  let layoutEffects = [];
  let passiveEffects = [];
  let nextInterval = 0;
  const intervals = new Map();
  const nextCell = (initial) => {
    const index = cursor;
    cursor += 1;
    if (!(index in cells)) cells[index] = initial;
    return index;
  };
  const scheduleEffect = (queue, callback, dependencies) => {
    const index = nextCell(null);
    const previous = cells[index];
    if (
      !previous ||
      !dependencies ||
      !previous.dependencies ||
      dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))
    ) {
      const cell = { dependencies };
      cells[index] = cell;
      queue.push(() => {
        previous?.cleanup?.();
        cell.cleanup = callback();
      });
    }
  };
  const hookLoad = createLoader(
    {
      react: {
        useState: (initial) => {
          const index = nextCell(initial);
          return [
            cells[index],
            (value) => {
              cells[index] = value;
            },
          ];
        },
        useRef: (initial) => cells[nextCell({ current: initial })],
        useCallback: (callback) => callback,
        useEffect: (callback, dependencies) =>
          scheduleEffect(passiveEffects, callback, dependencies),
        useLayoutEffect: (callback, dependencies) =>
          scheduleEffect(layoutEffects, callback, dependencies),
      },
      'react-native': {
        Animated: {
          Value: AnimatedValue,
          timing: (value, config) => ({ start: () => value.setValue(config.toValue) }),
        },
        Easing: { out: (value) => value, cubic: (value) => value },
        PanResponder: { create: (handlers) => ({ panHandlers: handlers }) },
      },
    },
    {
      setInterval: (callback) => {
        nextInterval += 1;
        intervals.set(nextInterval, callback);
        return nextInterval;
      },
      clearInterval: (id) => intervals.delete(id),
    }
  );
  const runHook = hookLoad('src/hooks/home/useSwipeableCard.ts').default;
  const render = (count, width, flushPassive = true) => {
    cursor = 0;
    layoutEffects = [];
    const result = runHook(count, width);
    layoutEffects.forEach((effect) => effect());
    if (flushPassive) {
      const pending = passiveEffects;
      passiveEffects = [];
      pending.forEach((effect) => effect());
    }
    return result;
  };
  let card = render(3, 100);
  card.panResponder.panHandlers.onPanResponderRelease(null, { dx: -60 });
  card = render(3, 100);
  card.panResponder.panHandlers.onPanResponderRelease(null, { dx: -60 });
  card = render(3, 100);
  assert.equal(card.activeIdx, 2);
  const oldInterval = [...intervals.values()][0];
  assert.ok(oldInterval);
  card = render(1, 75, false);
  assert.equal(card.activeIdx, 0, 'The render must never index a removed child');
  assert.ok(card.translateX.value === 0);
  oldInterval();
  assert.ok(
    card.translateX.value === 0,
    'The old interval must use the latest item count before passive cleanup'
  );
  render(1, 75);
  assert.equal(intervals.size, 0);
  card = render(3, 100);
  card.panResponder.panHandlers.onPanResponderRelease(null, { dx: -60 });
  card = render(3, 100);
  card = render(3, 75);
  assert.equal(card.translateX.value, -75);
  card = render(0, 75);
  card.panResponder.panHandlers.onPanResponderRelease(null, { dx: -60 });
  assert.equal(render(0, 75).activeIdx, 0);
});

['ko', 'en', 'vi', 'zh'].forEach((language) => {
  test(`${language}: home cards keep two columns with enlarged text and use the measured slide width`, () => {
    [320, 360, 390, 430].forEach((width) => {
      [1, 1.5, 2].forEach((fontScale) => {
        const cells = [];
        let cursor = 0;
        const locale = JSON.parse(
          fs.readFileSync(path.resolve(__dirname, `../src/i18n/locales/${language}.json`), 'utf8')
        );
        const jsx = (type, props) => ({ type, props });
        const homeLoad = createLoader({
          react: {
            useState: (initial) => {
              const index = cursor;
              cursor += 1;
              if (!(index in cells))
                cells[index] = typeof initial === 'function' ? initial() : initial;
              return [
                cells[index],
                (value) => {
                  cells[index] = typeof value === 'function' ? value(cells[index]) : value;
                },
              ];
            },
            useEffect: () => {},
          },
          'react/jsx-runtime': { jsx, jsxs: jsx },
          'react-native': {
            View: 'View',
            Text: 'Text',
            Image: 'Image',
            TouchableOpacity: 'TouchableOpacity',
            StyleSheet: { create: (styles) => styles },
            useWindowDimensions: () => ({ width, height: 700, fontScale }),
          },
          'expo-linear-gradient': { LinearGradient: 'LinearGradient' },
          '@expo/vector-icons': { Ionicons: 'Ionicons' },
          'expo-router': { router: { push: () => {} } },
          'react-i18next': {
            useTranslation: () => ({
              t: (key) => key.split('.').reduce((value, part) => value[part], locale),
              i18n: { language },
            }),
          },
          '../../store/childrenStore': {
            useChildrenStore: (select) => select({ children: [{ id: 1 }] }),
          },
          '../../api/meal': {},
          './MealCard': { default: 'MealCard' },
          './TimetableCard': { default: 'TimetableCard' },
          '../../../assets/images/home/home_ai.png': 1,
          '../../../assets/images/home/home_school.png': 2,
        });
        const FeatureSection = homeLoad('src/components/home/FeatureSection.tsx').default;
        const features = FeatureSection();
        const featureRow = collect(
          features,
          (node) => node.type === 'View' && node.props.style?.flexDirection === 'row'
        )[0];
        assert.ok(featureRow, 'Feature cards must remain in a horizontal row');
        assert.equal(featureRow.props.children.length, 2);
        featureRow.props.children.forEach((card) => assert.equal(card.props.style.flex, 1));

        const titleNodes = collect(
          features,
          (node) =>
            node.type === 'Text' && node.props.style?.fontSize === 16 && !!node.props.onLayout
        );
        assert.equal(titleNodes.length, 2);
        titleNodes.forEach((node) => assert.equal(typeof node.props.children, 'string'));
        if (language === 'ko') {
          assert.equal(titleNodes[1].props.children, '한국 학교\n생활 안내서');
          assert.equal(titleNodes[0].props.children, 'AI에게 물어보기');
        } else {
          assert.ok(!titleNodes[1].props.children.includes('\n'));
        }
        titleNodes[0].props.onLayout({ nativeEvent: { layout: { height: 24 } } });
        titleNodes[1].props.onLayout({ nativeEvent: { layout: { height: 48 } } });
        const buttonNodes = collect(
          features,
          (node) => node.type === 'Text' && Array.isArray(node.props.style) && !!node.props.onLayout
        );
        buttonNodes[0].props.onLayout({ nativeEvent: { layout: { height: 18 } } });
        buttonNodes[1].props.onLayout({ nativeEvent: { layout: { height: 36 } } });
        cursor = 0;
        const aligned = FeatureSection();
        const titleBlocks = collect(
          aligned,
          (node) =>
            node.type === 'View' &&
            Array.isArray(node.props.style) &&
            node.props.style[0]?.width === '100%'
        );
        assert.equal(titleBlocks.length, 2);
        titleBlocks.forEach((node) => assert.equal(node.props.style[1].minHeight, 48));
        const actions = collect(aligned, (node) => node.type === 'TouchableOpacity');
        assert.equal(actions.length, 2);
        actions.forEach((node) => assert.equal(node.props.style[1].minHeight, 48));

        titleNodes[1].props.onLayout({ nativeEvent: { layout: { height: 24 } } });
        buttonNodes[1].props.onLayout({ nativeEvent: { layout: { height: 18 } } });
        cursor = 0;
        const shorter = FeatureSection();
        const shorterTitles = collect(
          shorter,
          (node) =>
            node.type === 'View' &&
            Array.isArray(node.props.style) &&
            node.props.style[0]?.width === '100%'
        );
        shorterTitles.forEach((node) => assert.equal(node.props.style[1].minHeight, 24));
        const shorterActions = collect(shorter, (node) => node.type === 'TouchableOpacity');
        shorterActions.forEach((node) => assert.equal(node.props.style[1].minHeight, 30));

        cells.length = 0;
        cursor = 0;
        const Widget = homeLoad('src/components/home/MealTimetableWidget.tsx').default;
        let widget = Widget();
        let cards = collect(
          widget,
          (node) => node.type === 'MealCard' || node.type === 'TimetableCard'
        );
        assert.equal(cards.length, 2);
        cards.forEach((card) => assert.equal(card.props.cardWidth, (width - 40 - 16) / 2));
        const row = collect(widget, (node) => !!node.props.onLayout)[0];
        assert.equal(row.props.style.flexDirection, 'row');
        row.props.onLayout({ nativeEvent: { layout: { width: width - 64 } } });
        cursor = 0;
        widget = Widget();
        cards = collect(
          widget,
          (node) => node.type === 'MealCard' || node.type === 'TimetableCard'
        );
        assert.equal(cards.filter((card) => card.type === 'MealCard').length, 1);
        assert.equal(cards.filter((card) => card.type === 'TimetableCard').length, 1);
        cards.forEach((card) => assert.equal(card.props.cardWidth, (width - 64 - 16) / 2));
      });
    });
  });
});
