import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.gray[300],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: colors.text.white,
  },
  cardTop: {
    height: 120,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  cardImage: {
    width: '60%',
    height: '60%',
  },
  cardBottom: {
    backgroundColor: colors.text.white,
    paddingHorizontal: 15,
    paddingVertical: 20,
    gap: 15,
  },
  cardTexts: {
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
    lineHeight: 18,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  cardButtonText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    lineHeight: 14,
  },
});

export default styles;
