import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';
import { SCAN_FRAME_W, SCAN_FRAME_H } from '../../constants/scan';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.text.white,
    paddingTop: 60,
  },
  imageWrapper: {
    width: SCAN_FRAME_W,
    height: SCAN_FRAME_H,
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: SCAN_FRAME_W,
    height: SCAN_FRAME_H,
  },
  imagePlaceholder: {
    width: SCAN_FRAME_W,
    height: SCAN_FRAME_H,
    backgroundColor: colors.gray[100],
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary[400],
    opacity: 0.85,
    shadowColor: colors.primary[300],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
  },
  completionFrame: {
    width: SCAN_FRAME_W,
    height: SCAN_FRAME_H,
    alignSelf: 'center',
    borderRadius: 16,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  glowCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary[300],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 20,
  },
  completionText: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text.white,
  },
  statusArea: {
    marginHorizontal: layout.screenPaddingHorizontal,
    marginTop: 20,
    padding: 20,
    gap: 14,
    backgroundColor: colors.text.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray[100],
    shadowColor: colors.gray[300],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusTexts: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  statusSubtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    marginTop: 2,
  },
  percentText: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.primary[400],
  },
  doneIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.primary[400],
    borderRadius: 3,
  },
  nextBtnWrapper: {
    marginHorizontal: layout.screenPaddingHorizontal,
    marginTop: 16,
  },
  nextBtn: {
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text.white,
  },
});

export default styles;
