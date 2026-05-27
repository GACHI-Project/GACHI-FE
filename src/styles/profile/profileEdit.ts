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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(217, 217, 217, 0.5)',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: colors.text.white,
    borderRadius: 20,
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    gap: 15,
    alignItems: 'center',
  },
  iconBox: {
    backgroundColor: colors.primary[100],
    borderRadius: 10,
    padding: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  modalDesc: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  warningBanner: {
    backgroundColor: colors.secondary[500],
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    gap: 11,
    alignItems: 'center',
    width: '100%',
  },
  warningText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    lineHeight: 16,
    flex: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 55,
    borderRadius: 15,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
  },
  withdrawModalBtn: {
    flex: 1,
    height: 55,
    borderRadius: 15,
    backgroundColor: colors.text.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawModalBtnText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.gray[200],
  },
  withdrawModalBtnDisabled: {
    opacity: 0.4,
  },
});

export default styles;
