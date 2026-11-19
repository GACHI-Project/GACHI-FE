import { useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, type TextLayoutEvent } from 'react-native';
import colors from '../../../constants/colors';
import { OverlayBlock } from '../../../api/newsletter';
import {
  estimateOverlayFontSize,
  MIN_OVERLAY_FONT_SIZE,
  OVERLAY_LINE_HEIGHT_RATIO,
} from '../../../utils/translationOverlay';

interface TranslationOverlayProps {
  blocks: OverlayBlock[];
  renderedWidth: number;
  renderedHeight: number;
}

const FONT_STEP = 0.5;

const TranslationOverlay = ({ blocks, renderedWidth, renderedHeight }: TranslationOverlayProps) => {
  const { fontScale } = useWindowDimensions();
  const [fontAdjust, setFontAdjust] = useState<Record<number, number>>({});

  useLayoutEffect(() => {
    setFontAdjust({});
  }, [blocks, renderedWidth, renderedHeight, fontScale]);

  const handleTextLayout =
    (blockNo: number, boxHeight: number, baseFontSize: number, currentFontSize: number) =>
    (e: TextLayoutEvent) => {
      const textHeight = e.nativeEvent.lines.reduce(
        (bottom, line) => Math.max(bottom, line.y + line.height),
        0
      );
      if (textHeight > boxHeight && currentFontSize > MIN_OVERLAY_FONT_SIZE) {
        const nextAdjustment =
          baseFontSize - Math.max(MIN_OVERLAY_FONT_SIZE, currentFontSize - FONT_STEP);
        setFontAdjust((prev) => {
          if ((prev[blockNo] ?? 0) >= nextAdjustment) return prev;
          return { ...prev, [blockNo]: nextAdjustment };
        });
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
          const baseFontSize = estimateOverlayFontSize(text, boxWidth, boxHeight, fontScale);
          const adjust = fontAdjust[block.blockNo] ?? 0;
          const fontSize = Math.max(MIN_OVERLAY_FONT_SIZE, baseFontSize - adjust);
          const lineHeight = fontSize * OVERLAY_LINE_HEIGHT_RATIO;

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
                key={JSON.stringify([boxWidth, boxHeight, fontScale, text])}
                style={[styles.text, { fontSize, lineHeight }]}
                onTextLayout={handleTextLayout(block.blockNo, boxHeight, baseFontSize, fontSize)}
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
