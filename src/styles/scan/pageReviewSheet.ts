import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';

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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: 14,
    gap: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 12,
  },
  handleWrap: {
    alignItems: 'center',
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
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  count: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primary[500],
  },
  instruction: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  listContent: {
    gap: 10,
    paddingVertical: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 10,
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
  buttonDisabled: {
    backgroundColor: colors.primary[200],
  },
  buttonFilledText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
  },
});
