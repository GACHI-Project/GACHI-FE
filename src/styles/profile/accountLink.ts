import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  rowLast: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  providerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  providerName: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  statusText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  actionBtn: {
    flexShrink: 0,
    borderRadius: 999,
    minHeight: 32,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  disconnectBtn: {
    borderColor: colors.gray[200],
    backgroundColor: colors.text.white,
  },
  disconnectBtnText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  connectBtn: {
    borderColor: colors.primary[400],
    backgroundColor: colors.text.white,
  },
  connectBtnText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.primary[400],
  },
  hint: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    lineHeight: 18,
    paddingHorizontal: layout.screenPaddingHorizontal,
    marginTop: 8,
  },
});

export default styles;
