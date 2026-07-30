import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';

export const GREEN = '#4CAF50';
export const GREEN_LIGHT = '#E8F5E9';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.text.white,
  },
  childTabsWrap: {
    backgroundColor: colors.text.white,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  childTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  childTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  childTabActive: {
    backgroundColor: colors.primary[100],
  },
  childTabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  childTabText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  childTabTextActive: {
    fontFamily: fonts.semiBold,
    color: colors.primary[600],
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.text.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary[500],
  },
  tabText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  tabTextActive: {
    fontFamily: fonts.semiBold,
    color: colors.primary[600],
  },
  contentArea: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: 20,
    paddingBottom: layout.screenPaddingBottom,
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
  },

  // Timetable
  tableWrap: {
    backgroundColor: colors.text.white,
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.gray[300],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  tableRowEven: {
    backgroundColor: colors.gray[100],
  },
  tablePeriodCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: colors.gray[100],
  },
  tablePeriodText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  tableDayHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: colors.gray[100],
    gap: 2,
  },
  tableDayDate: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  tableDayName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  todayHeaderCol: {
    backgroundColor: colors.primary[0],
  },
  todayText: {
    color: colors.primary[600],
  },
  tableCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRightWidth: 1,
    borderRightColor: colors.gray[100],
  },
  todayCell: {
    backgroundColor: colors.primary[0],
  },
  tableCellText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    textAlign: 'center',
  },

  // Meal timeline
  timeline: {
    paddingTop: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 14,
  },
  timelineLeft: {
    width: 20,
    alignItems: 'center',
    paddingTop: 3,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gray[200],
  },
  timelineDotActive: {
    backgroundColor: colors.secondary[500],
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E4E8',
    marginTop: 4,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 24,
  },
  timelineDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  timelineDateText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text.secondary,
  },
  timelineDateTextToday: {
    color: colors.text.primary,
  },
  todayBadge: {
    backgroundColor: colors.secondary[100],
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  todayBadgeText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.secondary[600],
  },
  mealCard: {
    backgroundColor: colors.text.white,
    borderRadius: 14,
    padding: 16,
    gap: 9,
    shadowColor: colors.gray[300],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  mealBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.text.secondary,
    marginTop: 8,
  },
  mealName: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.primary,
    lineHeight: 21,
  },
  mealAllergyText: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  noMealText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: 6,
  },
});

export default styles;
