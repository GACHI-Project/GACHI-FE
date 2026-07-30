import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: colors.text.white,
    shadowColor: colors.gray[300],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardFixedSection: {
    padding: 15,
    paddingBottom: 0,
    gap: 12,
  },
  menuAreaContainer: {
    overflow: 'hidden',
  },
  menuPageContent: {
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
    gap: 2,
  },
  cardLabel: {
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  childDot: {
    width: 6,
    height: 6,
    borderRadius: 100,
  },
  childText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
    flex: 1,
  },
  menuList: {
    gap: 7,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  menuBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text.primary,
    marginTop: 7,
  },
  menuName: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 18,
  },
  allergyText: {
    color: colors.primary[500],
  },
  periodList: {
    gap: 8,
  },
  periodItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  periodBadge: {
    backgroundColor: colors.secondary[600],
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 44,
    alignItems: 'center',
  },
  periodBadgeText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
  },
  periodSubject: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginHorizontal: -15,
  },
  scrollArea: {
    maxHeight: 210,
  },
  loadingIndicator: {
    paddingVertical: 20,
  },
  slideRow: {
    flexDirection: 'row',
  },
  emptyText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default styles;
