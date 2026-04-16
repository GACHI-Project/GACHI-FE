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
  timeline: {
    gap: 30,
  },
  group: {},
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[500],
  },
  dateText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.primary[500],
  },
  timelineBody: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  lineColumn: {
    width: 12,
    alignItems: 'center',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.primary[500],
  },
  cardsArea: {
    flex: 1,
    gap: 15,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.gray[100],
    paddingHorizontal: 17,
    paddingVertical: 12,
    gap: 12,
  },
  docIconBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: colors.primary[300],
    borderWidth: 1,
    borderColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIcon: {
    marginLeft: 3,
  },
  docTexts: {
    flex: 1,
    gap: 4,
  },
  docTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  docMeta: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
});

export default styles;
