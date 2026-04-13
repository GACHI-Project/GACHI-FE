import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.text.white,
    borderRadius: 20,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray[100],
    gap: 20,
    shadowColor: '#1F2A37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  deleteButton: {
    marginLeft: 'auto',
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  orderLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  section: {
    gap: 10,
  },
  nameInput: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  nameDivider: {
    height: 1,
    backgroundColor: colors.gray[200],
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.text.secondary,
  },
  // 학교 — 아이콘 박스
  schoolIconBox: {
    width: 30,
    height: 30,
    borderRadius: 5,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolIconBoxLight: {
    width: 30,
    height: 30,
    borderRadius: 5,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 학교 — 선택 완료
  schoolSelectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[300],
    padding: 8,
    paddingHorizontal: 14,
    gap: 10,
  },
  schoolLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  schoolInfo: {
    flex: 1,
    gap: 3,
  },
  schoolName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  schoolAddress: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  changeButtonText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.primary[400],
  },
  // 학교 — 검색
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.text.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInputWrapFocused: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[0],
  },
  searchIcon: {
    marginTop: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.primary,
    padding: 0,
  },
  searchResults: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 4,
  },
  searchResultItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchResultInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchResultDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  searchResultName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  searchResultAddress: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  // 학년
  gradeList: {
    gap: 8,
    paddingVertical: 2,
  },
  gradeButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.text.white,
  },
  gradeButtonSelected: {
    backgroundColor: colors.primary[400],
    borderColor: colors.primary[400],
  },
  gradeText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.gray[300],
  },
  gradeTextSelected: {
    color: colors.text.white,
    fontFamily: fonts.semiBold,
  },
  // 캘린더 색상
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default cardStyles;
