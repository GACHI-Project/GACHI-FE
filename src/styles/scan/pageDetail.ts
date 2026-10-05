import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';
import { SCAN_FRAME_W, SCAN_FRAME_H } from '../../constants/scan';

export default StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.text.white,
    paddingHorizontal: layout.screenPaddingHorizontal,
    gap: 25,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSideSlot: {
    width: 100,
    flexShrink: 0,
  },
  headerSideSlotLeft: {
    alignItems: 'flex-start',
  },
  headerSideSlotRight: {
    alignItems: 'flex-end',
  },
  backButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  rotateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rotateButtonText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.gray[300],
  },
  frameWrapper: {
    width: SCAN_FRAME_W,
    height: SCAN_FRAME_H,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
  },
  pageSlide: {
    width: SCAN_FRAME_W,
    height: SCAN_FRAME_H,
  },
  pageImage: {
    width: '100%',
    height: '100%',
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: {
    left: 13,
  },
  arrowRight: {
    right: 13,
  },
  zoomChip: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: colors.text.secondary,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  zoomChipText: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
  },
  swipeHint: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.gray[300],
    textAlign: 'center',
  },
  thumbStrip: {
    height: 81,
    flexShrink: 0,
  },
  thumbRow: {
    gap: 15,
    paddingHorizontal: 2,
  },
  thumbWrap: {
    width: 60,
    height: 81,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  thumbWrapActive: {
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbBadge: {
    position: 'absolute',
    top: 5,
    left: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbBadgeText: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 10,
  },
  button: {
    flex: 1,
    height: 55,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutline: {
    backgroundColor: colors.text.white,
    borderWidth: 1,
    borderColor: colors.primary[400],
  },
  buttonOutlineText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.primary[400],
  },
  buttonFilled: {
    backgroundColor: colors.primary[400],
  },
  buttonFilledText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
  },
});
