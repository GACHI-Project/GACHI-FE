import { StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  headerWrap: {
    backgroundColor: colors.text.white,
    paddingTop: 60,
  },

  dateLabelRow: {
    height: 30,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  dateLabelText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },

  notifRowRead: {
    backgroundColor: colors.text.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  notifRowUnread: {
    backgroundColor: colors.primary[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textArea: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  notifTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.primary,
  },
  timeText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.gray[200],
  },
  notifBody: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
    lineHeight: 16,
    marginTop: 2,
  },

  tagRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  childTag: {
    backgroundColor: colors.gray[100],
    borderRadius: 999,
    paddingHorizontal: 8,
    height: 20,
    justifyContent: 'center',
  },
  childTagText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },

  loader: {
    marginTop: 60,
  },
  errorBox: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  retryBtn: {
    backgroundColor: colors.primary[400],
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryBtnText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.white,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.gray[300],
    textAlign: 'center',
    marginTop: 40,
  },
});

export default styles;
