import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.text.white,
    borderRadius: 20,
    paddingVertical: 16,
    shadowColor: colors.gray[100],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 17,
    gap: 13,
  },
  dateBadge: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dateMonth: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.text.white,
    lineHeight: 14,
  },
  dateDay: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
    lineHeight: 22,
  },
  summaryTexts: {
    flex: 1,
    gap: 5,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  summaryDesc: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  childCircles: {
    flexDirection: 'row',
  },
  childCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.text.white,
  },
  childCircleOverlap: {
    marginLeft: -8,
  },
  switch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginVertical: 12,
    marginHorizontal: 17,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 17,
    gap: 18,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.text.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary[400],
    borderColor: colors.primary[400],
  },
  checkMark: {
    fontSize: 12,
    color: colors.text.white,
    lineHeight: 14,
  },
  todoContent: {
    flex: 1,
    gap: 6,
  },
  todoTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  todoTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.gray[300],
  },
  todoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  childTag: {
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childTagText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
  },
  todoDesc: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  todayBadge: {
    width: 42,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
  },
  moreButton: {
    alignItems: 'center',
  },
  moreText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.text.secondary,
  },
});

export default styles;
