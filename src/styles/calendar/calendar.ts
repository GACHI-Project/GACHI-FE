import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },

  // 헤더
  headerWrap: {
    backgroundColor: colors.text.white,
    paddingTop: 60,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIconButton: {
    borderColor: colors.primary[400],
  },

  loadingContainerInline: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollTopButton: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  scrollArea: {
    flex: 1,
  },
  dayLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#888888',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: 12,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    gap: 10,
    paddingBottom: layout.screenPaddingBottom,
  },
  weekListContent: {
    gap: 10,
    paddingBottom: layout.screenPaddingBottom,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.gray[300],
    textAlign: 'center',
    marginTop: 40,
  },
  weekDateHeader: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#888888',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: 12,
    paddingBottom: 8,
  },
  cardGroup: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    gap: 10,
  },

  // 일정 카드
  card: {
    backgroundColor: colors.text.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray[100],
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    rowGap: 6,
    columnGap: 10,
    padding: 15,
  },
  cardLeft: {
    flex: 1,
    minWidth: 100,
    gap: 6,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    lineHeight: 20,
  },
  cardTags: {
    flexDirection: 'row',
    gap: 10,
  },
  tag: {
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: 220,
    flexShrink: 1,
  },
  tagFixed: {
    flexShrink: 0,
  },
  tagText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.gray[300],
  },
  dDayBadge: {
    backgroundColor: colors.gray[100],
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  dDayBadgeUrgent: {
    backgroundColor: 'rgba(229, 57, 53, 0.2)',
  },
  dDayText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.text.secondary,
  },
  dDayTextUrgent: {
    color: colors.text.red,
  },

  // 체크리스트
  checklistWrap: {
    padding: 15,
    gap: 10,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 2,
    borderWidth: 1.5,
    backgroundColor: colors.text.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#000000',
  },
  checkTextDone: {
    textDecorationLine: 'line-through',
    color: colors.text.secondary,
  },
});
