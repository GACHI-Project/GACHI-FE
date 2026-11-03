import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TextLayoutEvent } from 'react-native/Libraries/Types/CoreEventTypes';
import colors from '../../../constants/colors';
import { OverlayBlock } from '../../../api/newsletter';

interface TranslationOverlayProps {
  blocks: OverlayBlock[];
  renderedWidth: number;
  renderedHeight: number;
}

const MAX_FONT_SIZE = 24;
const MIN_FONT_SIZE = 4;
const FONT_STEP = 0.5;
const LINE_HEIGHT_RATIO = 1.2;
const WRAP_SLACK = 1.1;
const CJK_CHAR_WIDTH_RATIO = 1.0;
const DEFAULT_CHAR_WIDTH_RATIO = 0.55;
const CJK_REGEX = /[぀-ヿ㐀-䶿一-鿿가-힣豈-﫿]/;

const estimateTextWidth = (text: string, fontSize: number): number =>
  Array.from(text).reduce(
    (width, ch) =>
      width +
      (CJK_REGEX.test(ch) ? fontSize * CJK_CHAR_WIDTH_RATIO : fontSize * DEFAULT_CHAR_WIDTH_RATIO),
    0
  );

// 박스 크기(dp)와 텍스트로부터 다 채울 수 있는 가장 큰 폰트 크기를 추정한다.
const estimateFontSize = (text: string, boxWidth: number, boxHeight: number): number => {
  const steps = Math.round((MAX_FONT_SIZE - MIN_FONT_SIZE) / FONT_STEP);
  for (let i = 0; i <= steps; i += 1) {
    const fontSize = MAX_FONT_SIZE - i * FONT_STEP;
    const totalWidth = estimateTextWidth(text, fontSize) * WRAP_SLACK;
    const neededLines = Math.max(1, Math.ceil(totalWidth / boxWidth));
    const neededHeight = neededLines * fontSize * LINE_HEIGHT_RATIO;
    if (neededHeight <= boxHeight) {
      return fontSize;
    }
  }
  return MIN_FONT_SIZE;
};

const TranslationOverlay = ({ blocks, renderedWidth, renderedHeight }: TranslationOverlayProps) => {
  const [fontAdjust, setFontAdjust] = useState<Record<number, number>>({});

  useEffect(() => {
    setFontAdjust({});
  }, [blocks]);

  const handleTextLayout =
    (blockNo: number, boxHeight: number, lineHeight: number, currentFontSize: number) =>
    (e: TextLayoutEvent) => {
      const linesCount = e.nativeEvent.lines.length;
      if (linesCount * lineHeight > boxHeight && currentFontSize > MIN_FONT_SIZE) {
        setFontAdjust((prev) => ({ ...prev, [blockNo]: (prev[blockNo] ?? 0) + FONT_STEP }));
      }
    };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {blocks
        .filter((block) => !!block.translatedText?.trim())
        .map((block) => {
          const boxWidth = block.box.width * renderedWidth;
          const boxHeight = block.box.height * renderedHeight;
          const text = block.translatedText!;
          const baseFontSize = estimateFontSize(text, boxWidth, boxHeight);
          const adjust = fontAdjust[block.blockNo] ?? 0;
          const fontSize = Math.max(MIN_FONT_SIZE, baseFontSize - adjust);
          const lineHeight = fontSize * LINE_HEIGHT_RATIO;

          return (
            <View
              key={block.blockNo}
              style={[
                styles.block,
                {
                  left: block.box.x * renderedWidth,
                  top: block.box.y * renderedHeight,
                  width: boxWidth,
                  height: boxHeight,
                },
              ]}
            >
              <Text
                style={[styles.text, { fontSize, lineHeight }]}
                onTextLayout={handleTextLayout(block.blockNo, boxHeight, lineHeight, fontSize)}
              >
                {text}
              </Text>
            </View>
          );
        })}
    </View>
  );
};

export default TranslationOverlay;

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    backgroundColor: colors.text.white,
    borderRadius: 1,
    paddingHorizontal: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  text: {
    width: '100%',
    color: colors.text.primary,
    textAlign: 'left',
    includeFontPadding: false,
  },
});
