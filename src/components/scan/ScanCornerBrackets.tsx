import { View, StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import { SCAN_CORNER, SCAN_THICK } from '../../constants/scan';

const ScanCornerBrackets = () => (
  <>
    <View style={[styles.corner, styles.topLeft]} pointerEvents="none">
      <View style={[styles.cornerH, styles.top]} />
      <View style={[styles.cornerV, styles.innerTopLeft]} />
    </View>
    <View style={[styles.corner, styles.topRight]} pointerEvents="none">
      <View style={[styles.cornerH, styles.top]} />
      <View style={[styles.cornerV, styles.innerTopRight]} />
    </View>
    <View style={[styles.corner, styles.bottomLeft]} pointerEvents="none">
      <View style={[styles.cornerH, styles.bottom]} />
      <View style={[styles.cornerV, styles.innerBottomLeft]} />
    </View>
    <View style={[styles.corner, styles.bottomRight]} pointerEvents="none">
      <View style={[styles.cornerH, styles.bottom]} />
      <View style={[styles.cornerV, styles.innerBottomRight]} />
    </View>
  </>
);

export default ScanCornerBrackets;

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    width: SCAN_CORNER,
    height: SCAN_CORNER,
    zIndex: 10,
  },
  cornerH: {
    position: 'absolute',
    width: SCAN_CORNER,
    height: SCAN_THICK,
    backgroundColor: colors.text.white,
    borderRadius: 2,
  },
  cornerV: {
    position: 'absolute',
    width: SCAN_THICK,
    height: SCAN_CORNER,
    backgroundColor: colors.text.white,
    borderRadius: 2,
  },
  topLeft: { top: 16, left: 16 },
  topRight: { top: 16, right: 16 },
  bottomLeft: { bottom: 16, left: 16 },
  bottomRight: { bottom: 16, right: 16 },
  top: { top: 0 },
  bottom: { bottom: 0 },
  innerTopLeft: { top: 0, left: 0 },
  innerTopRight: { top: 0, right: 0 },
  innerBottomLeft: { bottom: 0, left: 0 },
  innerBottomRight: { bottom: 0, right: 0 },
});
