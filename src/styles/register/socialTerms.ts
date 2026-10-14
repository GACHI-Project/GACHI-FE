import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text.white,
    paddingTop: 60,
  },
  body: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: layout.screenPaddingTop,
    paddingBottom: layout.screenPaddingBottom,
  },
  titleSection: {
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    lineHeight: 36,
  },
  spacer: {
    flex: 1,
  },
  termsCard: {
    gap: 14,
  },
  allAgreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  allAgreeText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
  },
  itemsList: {
    gap: 24,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleChecked: {
    backgroundColor: colors.primary[400],
  },
  checkCircleUnchecked: {
    backgroundColor: colors.gray[200],
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  termsRowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  termsRowLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.primary,
  },
  footer: {
    marginTop: 24,
  },
});

export default styles;
