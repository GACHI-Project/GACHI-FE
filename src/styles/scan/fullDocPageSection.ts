import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

export default StyleSheet.create({
  section: {
    gap: 12,
    backgroundColor: colors.text.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: colors.gray[300],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbWrap: {
    width: 40,
    height: 54,
    flexShrink: 0,
  },
  headerTexts: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  pageLabel: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  pageOf: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  chevron: {
    flexShrink: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
  },
  body: {
    gap: 10,
  },
  translatedLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.primary[500],
  },
  bodyText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text.primary,
    lineHeight: 21,
  },
  noticeText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  noticeBox: {
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  noticeBoxText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
