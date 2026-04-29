import { View, StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import { SCAN_CORNER, SCAN_THICK } from '../../constants/scan';

const ScanCornerBrackets = () => (
  <>
    <View style={[styles.corner, { top: 16, left: 16 }]} pointerEvents="none">
      <View style={[styles.cornerH, { top: 0 }]} />
      <View style={[styles.cornerV, { top: 0, left: 0 }]} />
    </View>
    <View style={[styles.corner, { top: 16, right: 16 }]} pointerEvents="none">
      <View style={[styles.cornerH, { top: 0 }]} />
      <View style={[styles.cornerV, { top: 0, right: 0 }]} />
    </View>
    <View style={[styles.corner, { bottom: 16, left: 16 }]} pointerEvents="none">
      <View style={[styles.cornerH, { bottom: 0 }]} />
      <View style={[styles.cornerV, { bottom: 0, left: 0 }]} />
    </View>
    <View style={[styles.corner, { bottom: 16, right: 16 }]} pointerEvents="none">
      <View style={[styles.cornerH, { bottom: 0 }]} />
      <View style={[styles.cornerV, { bottom: 0, right: 0 }]} />
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
});
