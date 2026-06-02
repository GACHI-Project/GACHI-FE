import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[0],
  },
  topSection: {
    backgroundColor: colors.text.white,
    paddingTop: 60,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: 8,
    paddingBottom: 20,
  },
  titleEmoji: {
    fontSize: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  tabBar: {
    paddingBottom: 16,
    flexGrow: 0,
    flexShrink: 0,
  },
  tabContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    gap: 8,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  tabSelected: {
    borderWidth: 1,
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[0],
  },
  tabText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  tabTextSelected: {
    color: colors.primary[500],
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: 12,
  },
  countText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.secondary,
  },
  countBold: {
    fontFamily: fonts.bold,
    color: colors.primary[500],
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: layout.screenPaddingBottom,
    gap: 16,
  },
  qaCard: {
    shadowColor: '#4DA3FF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: colors.text.white,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  qaCardExpanded: {
    borderColor: colors.primary[500],
    backgroundColor: colors.text.white,
  },
  qaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  qaLabel: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.primary[500],
  },
  qaQuestion: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    lineHeight: 20,
  },
  qaQuestionExpanded: {
    color: colors.primary[500],
    fontFamily: fonts.semiBold,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
    backgroundColor: colors.primary[200],
  },
  qaAnswer: {
    padding: 16,
    paddingTop: 14,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.primary,
    lineHeight: 22,
  },
});

export default styles;
