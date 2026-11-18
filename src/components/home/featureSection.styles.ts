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
    minWidth: 0,
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
    flexGrow: 1,
    backgroundColor: colors.text.white,
    paddingHorizontal: 15,
    paddingVertical: 20,
    gap: 15,
  },
  cardTexts: {
    flexGrow: 1,
    gap: 8,
  },
  titleBlock: {
    width: '100%',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
    lineHeight: 24,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  cardButton: {
    minHeight: 30,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cardButtonText: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: fonts.semiBold,
    lineHeight: 16,
  },
});

export default styles;
