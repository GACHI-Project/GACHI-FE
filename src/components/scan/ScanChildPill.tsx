import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

interface ScanChildPillProps {
  name: string;
  color: string;
  onChangePress?: () => void;
}

const ScanChildPill = ({ name, color, onChangePress }: ScanChildPillProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.text} numberOfLines={1}>
        <Text style={styles.name}>{name}</Text>
        {t('scan.childPill.suffix')}
      </Text>
      {onChangePress && (
        <TouchableOpacity
          onPress={onChangePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={t('scan.childPill.changeAccessibility')}
          accessibilityRole="button"
        >
          <Text style={styles.change}>{t('scan.childPill.change')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ScanChildPill;

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: '90%',
    backgroundColor: colors.primary[400],
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 6,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  text: {
    flexShrink: 1,
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.white,
  },
  name: {
    fontFamily: fonts.semiBold,
  },
  change: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
    textDecorationLine: 'underline',
    marginLeft: 2,
  },
});
