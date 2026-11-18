export const MIN_OVERLAY_FONT_SIZE = 12;
export const OVERLAY_LINE_HEIGHT_RATIO = 1.2;

const CJK_REGEX = /[぀-ヿ㐀-䶿一-鿿가-힣豈-﫿]/;

export const estimateOverlayFontSize = (
  text: string,
  boxWidth: number,
  boxHeight: number,
  fontScale: number
): number => {
  const scale = Math.max(fontScale, 1);
  const lineWidths = text
    .split(/\r\n|[\r\n]/)
    .map((line) =>
      Array.from(line).reduce((width, ch) => width + (CJK_REGEX.test(ch) ? 1 : 0.55), 0)
    );
  const availableWidth = Math.max(boxWidth - 2, 1);
  for (let fontSize = 24; fontSize >= MIN_OVERLAY_FONT_SIZE; fontSize -= 0.5) {
    const neededLines = lineWidths.reduce(
      (count, width) =>
        count + Math.max(1, Math.ceil((width * fontSize * scale * 1.1) / availableWidth)),
      0
    );
    if (neededLines * fontSize * scale * OVERLAY_LINE_HEIGHT_RATIO <= boxHeight) return fontSize;
  }
  // Longer translations remain available in the viewer's full-text mode.
  return MIN_OVERLAY_FONT_SIZE;
};
