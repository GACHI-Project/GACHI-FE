import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.text.white,
    paddingTop: 60,
  },
  content: {
    flex: 1,
  },
  docInfo: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: 16,
    gap: 10,
  },
  docTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  metaText: {
    flexShrink: 1,
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  dBadge: {
    backgroundColor: 'rgba(229, 57, 53, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 4,
  },
  dBadgeUrgent: {
    backgroundColor: 'rgba(229, 57, 53, 0.35)',
  },
  dBadgeText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.text.red,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 15,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.gray[300],
    textAlign: 'center',
  },
  tabLabelActive: {
    fontFamily: fonts.semiBold,
    color: colors.primary[500],
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary[500],
    borderRadius: 1,
  },
  tabDivider: {
    height: 1,
    backgroundColor: colors.gray[100],
  },
  scrollView: {
    flex: 1,
  },
  scrollViewTinted: {
    backgroundColor: colors.primary[0],
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 12,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: 16,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    backgroundColor: colors.text.white,
    shadowColor: colors.gray[300],
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 24,
  },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.text.white,
    shadowColor: colors.gray[300],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  btnIcon: {
    fontSize: 18,
  },
  chatBtnText: {
    flexShrink: 1,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.primary[400],
    shadowColor: colors.gray[300],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveBtnText: {
    flexShrink: 1,
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.text.white,
  },
});

export default styles;
