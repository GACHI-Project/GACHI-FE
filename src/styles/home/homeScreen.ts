import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.text.white,
  },
  header: {
    backgroundColor: colors.primary[200],
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: 20,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTexts: {
    gap: 5,
  },
  greeting: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text.primary,
  },
  username: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.text.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  contentWrapper: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 350,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 22,
  },
});

export default styles;
