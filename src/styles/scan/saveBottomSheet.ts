import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';

export const EVENT_DOT_COLOR = '#2CDA00';

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalRoot: {
    flex: 1,
  },
  backdropTap: {
    flex: 1,
  },
  sheetWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: colors.text.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: 16,
    gap: 20,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray[200],
    alignSelf: 'center',
  },
  iconWrap: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  eventCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.text.white,
    padding: 16,
    gap: 10,
  },
  successEventInfo: {
    flex: 1,
    gap: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: EVENT_DOT_COLOR,
    flexShrink: 0,
    marginTop: 3,
  },
  eventTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  eventDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 18,
  },
  eventDate: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
    flex: 1,
  },
  editBadge: {
    backgroundColor: colors.primary[100],
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
  },
  editBadgeText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.primary[500],
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
  },
  reminderList: {
    gap: 6,
    paddingLeft: 4,
  },
  reminderRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  reminderBullet: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  reminderText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  warningCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 14,
    backgroundColor: colors.secondary[500],
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    lineHeight: 20,
  },
  dateEditorCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.secondary[100],
    padding: 16,
    gap: 12,
  },
  dateEditorLabel: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.text.secondary,
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
  },
  dateInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
    padding: 0,
  },
  dateUnit: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  dateConfirmBtn: {
    backgroundColor: colors.secondary[500],
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dateConfirmBtnText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  buttons: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
});

export default styles;
