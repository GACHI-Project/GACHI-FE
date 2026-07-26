import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text.white,
    paddingTop: 60,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.text.white,
  },
  section: {},
  disabled: {
    opacity: 0.4,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.secondary,
    paddingLeft: layout.screenPaddingHorizontal,
    marginTop: 16,
    marginBottom: 10,
  },
  // 전체 알림 카드
  masterCard: {
    backgroundColor: colors.text.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginHorizontal: layout.screenPaddingHorizontal,
    paddingHorizontal: 16,
    minHeight: 66,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  masterTextWrap: {
    flex: 1,
    gap: 6,
  },
  masterTitle: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  masterDesc: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  // 세그먼트
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 10,
    padding: 3,
    marginHorizontal: layout.screenPaddingHorizontal,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentTabSelected: {
    backgroundColor: colors.text.white,
    borderWidth: 0.5,
    borderColor: colors.gray[100],
  },
  segmentText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  segmentTextSelected: {
    fontFamily: fonts.medium,
    color: colors.primary[600],
  },
  // 알림 단계 설명 박스
  levelDescBox: {
    backgroundColor: colors.primary[0],
    borderWidth: 1,
    borderColor: colors.primary[100],
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    marginHorizontal: layout.screenPaddingHorizontal,
  },
  levelDescText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.primary[600],
    lineHeight: 20,
  },
  // 항목별 알림 카드
  itemCard: {
    backgroundColor: colors.text.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginHorizontal: layout.screenPaddingHorizontal,
    overflow: 'hidden',
  },
  itemRow: {
    // height: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextWrap: {
    flex: 1,
    gap: 3,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 4,
    columnGap: 6,
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  itemDesc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    width: '100%',
  },
  // 뱃지
  badge: {
    minHeight: 21,
    paddingVertical: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  badge_urgent: {
    backgroundColor: 'rgba(225,0,0,0.1)',
  },
  badge_important: {
    backgroundColor: colors.secondary[100],
  },
  badge_general: {
    backgroundColor: colors.primary[100],
  },
  badgeText: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  badgeText_urgent: {
    color: colors.text.red,
  },
  badgeText_important: {
    color: colors.secondary[600],
  },
  badgeText_general: {
    color: colors.primary[400],
  },
  scrollBottom: {
    height: 40,
  },
});
