import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

const ScanBanner = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.banner}>
      <View style={styles.iconWrapper}>
        <Ionicons name="scan-outline" size={28} color={colors.text.white} />
      </View>
      <View style={styles.texts}>
        <Text style={styles.title}>{t('home.scanBanner.title')}</Text>
        <Text style={styles.desc}>{t('home.scanBanner.desc')}</Text>
      </View>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.8}
        onPress={() => router.push('/scan')}
      >
        <Text style={styles.buttonText}>{t('home.scanBanner.button')}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ScanBanner;

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary[200],
    borderRadius: 15,
    padding: 15,
    gap: 15,
  },
  iconWrapper: {
    width: 45,
    height: 45,
    borderRadius: 8,
    backgroundColor: colors.secondary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  desc: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  button: {
    backgroundColor: colors.text.white,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  buttonText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
});
