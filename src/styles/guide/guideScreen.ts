import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[0],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: layout.screenPaddingBottom,
  },
  headerWrap: {
    backgroundColor: colors.text.white,
    paddingTop: 60,
  },
  topSection: {
    backgroundColor: colors.text.white,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchPlaceholder: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.gray[200],
  },
  section: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  popularCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
    gap: 8,
    shadowColor: '#4DA3FF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  popularQ: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primary[500],
  },
  popularText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.primary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47.5%',
    backgroundColor: colors.text.white,
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#4DA3FF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryEmoji: {
    fontSize: 30,
  },
  categoryTexts: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
    marginBottom: 8,
  },
  categoryCount: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
});

export default styles;
