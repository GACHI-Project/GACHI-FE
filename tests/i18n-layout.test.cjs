/* eslint-env node */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const createLoader = (mocks = {}) => {
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

// Execute viewer interactions and effects without replacing its production render logic.
const createViewer = (language) => {
  const dimensions = { width: 320, height: 568, fontScale: 1.5 };
  const locale = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, `../src/i18n/locales/${language}.json`), 'utf8')
  );
  const translate = (key) => key.split('.').reduce((value, part) => value[part], locale);
  const cells = [];
  let cursor = 0;
  let dirty = false;
  let effects = [];
  const react = {
    useState: (initial) => {
      const index = cursor;
      cursor += 1;
      if (!(index in cells)) cells[index] = initial;
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
    useEffect: (callback, dependencies) => {
      const index = cursor;
      cursor += 1;
      const previous = cells[index];
      if (!previous || dependencies.some((value, i) => !Object.is(value, previous[i]))) {
        cells[index] = dependencies;
        effects.push(callback);
      }
    },
  };
  const jsx = (type, props) => ({ type, props });
  const load = createLoader({
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': {
      ...Object.fromEntries(
        ['View', 'Text', 'Image', 'TouchableOpacity', 'Modal', 'ScrollView'].map((name) => [
          name,
          name,
        ])
      ),
      StyleSheet: { create: (styles) => styles },
      useWindowDimensions: () => dimensions,
    },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 24, bottom: 16 }) },
    'react-native-gesture-handler': { GestureHandlerRootView: 'GestureHandlerRootView' },
    '@expo/vector-icons': { Ionicons: 'Ionicons' },
    'react-i18next': { useTranslation: () => ({ t: translate }) },
    '../../common/PinchZoomView': { default: 'PinchZoomView' },
    '../../common/Button': { PrimaryButton: 'PrimaryButton', SecondaryButton: 'SecondaryButton' },
    './TranslationOverlay': { default: 'TranslationOverlay' },
  });
  const Component = load('src/components/scan/result/PageImageViewerModal.tsx').default;
  let props;
  let tree;
  const render = (updates = {}) => {
    props = { ...props, ...updates };
    let renders = 0;
    do {
      cursor = 0;
      dirty = false;
      effects = [];
      tree = Component(props);
      effects.forEach((effect) => effect());
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
    const fullText = collect(
      viewer.tree,
      (node) => node.type === 'Text' && node.props.selectable
    )[0];
    assert.equal(fullText.props.children, text.trim());
    assert.equal(fullText.props.numberOfLines, undefined);
    assert.ok(collect(viewer.tree, (node) => node.type === 'ScrollView').length);
    viewer.press(viewerKey('viewImage'));
    assert.equal(collect(viewer.tree, (node) => node.type === 'TranslationOverlay').length, 1);
    assert.ok(estimateOverlayFontSize(text, 40, 12, 2) >= MIN_OVERLAY_FONT_SIZE);
  });
});

test('viewer fits portrait images into the measured space left by translated controls', () => {
  const viewer = createViewer('vi');
  viewer.render({
    visible: true,
    page: { pageNo: 1, imageWidth: 100, imageHeight: 200, translatedText: 'Text' },
    totalPages: 1,
  });
  const area = collect(viewer.tree, (node) => !!node.props.onLayout)[0];
  area.props.onLayout({ nativeEvent: { layout: { height: 100 } } });
  viewer.render();
  const image = collect(viewer.tree, (node) => node.type === 'PinchZoomView')[0];
  assert.equal(image.props.style.height, 100);
  assert.equal(image.props.style.width, 50);
  viewer.dimensions.width = 240;
  area.props.onLayout({ nativeEvent: { layout: { height: 600 } } });
  viewer.render();
  const resized = collect(viewer.tree, (node) => node.type === 'PinchZoomView')[0];
  assert.equal(resized.props.style.width, 200);
  assert.equal(resized.props.style.height, 400);
});

test('changing pages or reopening resets the viewer without showing the previous full translation', () => {
  const viewer = createViewer('en');
  viewer.render({
    visible: true,
    page: { pageNo: 1, translatedText: 'Previous page' },
    totalPages: 2,
  });
  viewer.press(viewerKey('readText'));
  viewer.render({ page: { pageNo: 2, translatedText: 'Next page' } });
  assert.equal(collect(viewer.tree, (node) => node.props.selectable).length, 0);
  viewer.press(viewerKey('readText'));
  assert.equal(
    collect(viewer.tree, (node) => node.props.selectable)[0].props.children,
    'Next page'
  );
  viewer.render({ visible: false });
  viewer.render({ visible: true });
  assert.equal(collect(viewer.tree, (node) => node.props.selectable).length, 0);
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

test('home card selection stays valid during child removal and resizes without a stale offset', () => {
  const cells = [];
  let cursor = 0;
  let layoutEffects = [];
  const nextCell = (initial) => {
    const index = cursor;
    cursor += 1;
    if (!(index in cells)) cells[index] = initial;
    return index;
  };
  class AnimatedValue {
    constructor(value) {
      this.value = value;
    }

    setValue(value) {
      this.value = value;
    }
  }
  const hookLoad = createLoader({
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
      useEffect: () => {},
      useLayoutEffect: (callback) => {
        layoutEffects.push(callback);
      },
    },
    'react-native': {
      Animated: {
        Value: AnimatedValue,
        timing: (value, config) => ({ start: () => value.setValue(config.toValue) }),
      },
      Easing: { out: (value) => value, cubic: (value) => value },
      PanResponder: { create: (handlers) => ({ panHandlers: handlers }) },
    },
  });
  const runHook = hookLoad('src/hooks/home/useSwipeableCard.ts').default;
  const render = (count, width) => {
    cursor = 0;
    layoutEffects = [];
    const result = runHook(count, width);
    layoutEffects.forEach((effect) => effect());
    return result;
  };
  let card = render(3, 100);
  card.panResponder.panHandlers.onPanResponderRelease(null, { dx: -60 });
  card = render(3, 100);
  card.panResponder.panHandlers.onPanResponderRelease(null, { dx: -60 });
  card = render(3, 100);
  assert.equal(card.activeIdx, 2);
  card = render(1, 75);
  assert.equal(card.activeIdx, 0, 'The render must never index a removed child');
  assert.ok(card.translateX.value === 0);
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
        cards.forEach((card) => assert.equal(card.props.cardWidth, (width - 64 - 16) / 2));
      });
    });
  });
});
