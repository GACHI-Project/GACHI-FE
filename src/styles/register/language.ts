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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: layout.screenPaddingTop,
    paddingBottom: 24,
  },
  // 타이틀
  titleSection: {
    marginBottom: 20,
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
    lineHeight: 22,
  },

  cardList: {
    gap: 15,
  },

  flagWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  flagImage: {
    width: 50,
    height: 50,
  },
  footer: {
    marginTop: 16,
    gap: 16,
    paddingBottom: layout.screenPaddingBottom,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary[500],
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 15,
    gap: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    lineHeight: 20,
  },
});

export default styles;
