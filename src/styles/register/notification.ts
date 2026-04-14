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
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    marginBottom: 14,
  },
  // 알림 옵션 카드
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 15,
    height: 90,
    paddingHorizontal: 20,
    gap: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  selectedBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary[400],
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
  },
  cardSelected: {
    backgroundColor: colors.primary[0],
    borderColor: colors.primary[400],
    shadowColor: '#1F2A37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  // 아이콘 박스
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxBordered: {
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  // 카드 콘텐츠
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text.primary,
  },
  badge: {
    backgroundColor: colors.primary[100],
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.primary[500],
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  // 아이콘 반전
  iconFlipped: {
    transform: [{ scaleX: -1 }],
  },
  // 라디오 버튼
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.text.white,
  },
  radioSelected: {
    backgroundColor: colors.primary[0],
    borderColor: colors.primary[400],
    borderWidth: 7,
  },
  // 안내 배너
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary[500],
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    lineHeight: 20,
  },
  // 버튼 그룹
  buttonGroup: {
    marginTop: 16,
    gap: 10,
    paddingBottom: layout.screenPaddingBottom,
  },
});

export default styles;
