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

  // 언어 선택 카드
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 15,
    height: 90,
    paddingHorizontal: 22,
    gap: 14,
    marginBottom: 10,
    overflow: 'hidden',
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
  // 국기 이미지
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
  // 카드 텍스트
  cardContent: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontSize: 20,
    fontFamily: fonts.medium,
    color: colors.text.primary,
  },
  cardLabel: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
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
