import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import { CapturedPage } from '../../constants/scan';

interface ScanCapturedStackProps {
  pages: CapturedPage[];
  onPress: () => void;
  disabled?: boolean;
}

const ScanCapturedStack = ({ pages, onPress, disabled = false }: ScanCapturedStackProps) => {
  const { t } = useTranslation();
  if (pages.length === 0) return null;

  const front = pages[pages.length - 1];
  const back = pages.length > 1 ? pages[pages.length - 2] : undefined;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={t('scan.camera.stackConfirmAccessibility')}
    >
      <View style={styles.thumbWrap}>
        {back && <Image source={{ uri: back.uri }} style={styles.thumbBack} />}
        <Image source={{ uri: front.uri }} style={styles.thumbFront} />
        <View style={styles.badge}>
          <Text style={styles.badgeText} allowFontScaling={false}>
            {pages.length}
          </Text>
        </View>
      </View>
      <View style={styles.linkRow}>
        <Text style={styles.linkText} numberOfLines={1}>
          {t('scan.camera.stackConfirmLink')}
        </Text>
        <Ionicons name="chevron-forward" size={10} color={colors.primary[600]} />
      </View>
    </TouchableOpacity>
  );
};

export default ScanCapturedStack;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
    width: 69,
  },
  thumbWrap: {
    width: 62,
    height: 56,
  },
  thumbBack: {
    position: 'absolute',
    top: 2,
    left: 0,
    width: 33,
    height: 46,
    borderRadius: 2,
    transform: [{ rotate: '-15deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  thumbFront: {
    position: 'absolute',
    top: 5,
    left: 24,
    width: 34,
    height: 48,
    borderRadius: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary[400],
    borderWidth: 1.5,
    borderColor: colors.text.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  linkText: {
    fontSize: 9,
    fontFamily: fonts.semiBold,
    color: colors.primary[600],
  },
});
