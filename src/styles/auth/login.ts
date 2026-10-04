import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary[100],
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  gradient: {
    minHeight: 180,
    flex: 1,
  },
  container: {
    backgroundColor: colors.text.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: 40,
    paddingBottom: 60,
    gap: 18,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  stayLoggedInRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
  },
  checkbox: {
    width: 15,
    height: 15,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[0],
  },
  checkboxChecked: {
    backgroundColor: colors.primary[400],
    borderColor: colors.primary[400],
  },
  checkboxMark: {
    color: colors.text.white,
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
  },
  stayLoggedInText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  forgotRow: {
    textAlign: 'center',
  },
  forgotText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.primary,
  },
  signUpText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.primary,
    textAlign: 'center',
  },
  signUpLink: {
    fontFamily: fonts.semiBold,
  },
  errorText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.red,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[200],
  },
  dividerText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.gray[300],
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  socialIcon: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
});

export default styles;
