import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import { DocumentItem } from '../../mock/documents';

interface DocumentCardProps {
  item: DocumentItem;
  onPress: () => void;
}

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const DocumentCard = ({ item, onPress }: DocumentCardProps) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.colorBar, { backgroundColor: item.calendarColor }]} />

      <View style={[styles.iconBox, { backgroundColor: hexToRgba(item.calendarColor, 0.3) }]}>
        <AntDesign name="file-text" size={25} color={item.calendarColor} style={styles.docIcon} />
      </View>

      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.childInfo} numberOfLines={1}>
            {item.childName} · {t('common.elementaryGrade', { grade: item.grade })}
          </Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.date}>{item.date}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray[200]} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default DocumentCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.text.white,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: colors.gray[200],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  colorBar: {
    width: 3,
    alignSelf: 'stretch',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginHorizontal: 12,
    marginTop: 14,
  },
  info: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 14,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  childInfo: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  docIcon: {
    marginLeft: 2,
  },
});
