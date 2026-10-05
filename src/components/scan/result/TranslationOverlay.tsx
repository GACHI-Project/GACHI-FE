import { View, Text, StyleSheet } from 'react-native';
import colors from '../../../constants/colors';
import { OverlayBlock } from '../../../api/newsletter';

interface TranslationOverlayProps {
  blocks: OverlayBlock[];
  renderedWidth: number;
  renderedHeight: number;
}

const REFERENCE_LINE_HEIGHT = 14;
const MAX_FONT_SIZE = 60;
const MIN_FONT_SIZE = 8;
const MIN_FONT_SCALE = 0.4;

const TranslationOverlay = ({ blocks, renderedWidth, renderedHeight }: TranslationOverlayProps) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {blocks
      .filter((block) => !!block.translatedText?.trim())
      .map((block) => {
        const boxWidth = block.box.width * renderedWidth;
        const boxHeight = block.box.height * renderedHeight;
        const numberOfLines = Math.max(1, Math.floor(boxHeight / REFERENCE_LINE_HEIGHT));
        const fontSize = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, boxHeight * 1.5));

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
              style={[styles.text, { fontSize }]}
              numberOfLines={numberOfLines}
              adjustsFontSizeToFit
              minimumFontScale={MIN_FONT_SCALE}
            >
              {block.translatedText}
            </Text>
          </View>
        );
      })}
  </View>
);

export default TranslationOverlay;

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: colors.primary[500],
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 1,
    paddingHorizontal: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    width: '100%',
    color: colors.text.primary,
    textAlign: 'left',
    includeFontPadding: false,
  },
});
