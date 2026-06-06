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
    backgroundColor: colors.text.white,
  },
  profileCard: {
    backgroundColor: colors.text.white,
    borderRadius: 14,
    marginHorizontal: layout.screenPaddingHorizontal,
    marginTop: 10,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  loginId: {
    fontSize: 17,
    fontFamily: fonts.medium,
    color: colors.text.primary,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.secondary,
    paddingLeft: layout.screenPaddingHorizontal,
    marginTop: 20,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.text.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginHorizontal: layout.screenPaddingHorizontal,
  },
  row: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.primary,
  },
  rowValue: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  withdrawBtn: {
    height: 55,
    borderRadius: 12,
    backgroundColor: 'rgba(229, 57, 53, 0.2)',
    marginHorizontal: layout.screenPaddingHorizontal,
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text.red,
  },
});

export default styles;
