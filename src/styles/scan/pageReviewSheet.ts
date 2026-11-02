import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

export default StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdropTap: {
    flex: 1,
  },
  sheetWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: colors.text.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 12,
  },
  topChrome: {
    flexShrink: 0,
  },
  handleWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  handle: {
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray[200],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    lineHeight: 28,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  count: {
    flexShrink: 0,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.semiBold,
    color: colors.primary[500],
    backgroundColor: colors.primary[0],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  instruction: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  list: {
    flexGrow: 0,
    flexShrink: 0,
  },
  listContent: {
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  buttonRow: {
    flexShrink: 0,
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    minHeight: 56,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutline: {
    backgroundColor: colors.text.white,
    borderWidth: 1,
    borderColor: colors.primary[400],
  },
  buttonOutlineText: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.semiBold,
    color: colors.primary[400],
  },
  buttonFilled: {
    backgroundColor: colors.primary[400],
  },
  buttonDisabled: {
    backgroundColor: colors.primary[200],
  },
  buttonFilledText: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
  },
});
