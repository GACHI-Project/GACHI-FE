import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  moreText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#888888',
  },
  scrollContent: {
    paddingRight: 15,
    gap: 15,
  },
  card: {
    width: 150,
    height: 120,
    borderRadius: 20,
    backgroundColor: colors.text.white,
    borderWidth: 1,
    borderColor: colors.gray[100],
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 5,
    shadowColor: '#EEEEEE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardEmoji: {
    fontSize: 18,
  },
  cardQuestion: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
    lineHeight: 16,
    flex: 1,
  },
  guideBadge: {
    width: 52,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  guideBadgeText: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
  },
});

export default styles;
