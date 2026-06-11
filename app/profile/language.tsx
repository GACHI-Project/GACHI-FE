import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../src/components/common/Header';
import LanguageSelector from '../../src/components/profile/LanguageSelector';
import { PrimaryButton } from '../../src/components/common/Button';
import { LanguageType, toServerLanguageCode } from '../../src/types/language';
import { saveLanguage, SUPPORTED_LANGUAGES } from '../../src/i18n';
import { updateLanguage } from '../../src/api/user';
import colors from '../../src/constants/colors';
import fonts from '../../src/constants/fonts';
import layout from '../../src/constants/layout';

const ProfileLanguageScreen = () => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<LanguageType>(
    SUPPORTED_LANGUAGES.includes(i18n.language as LanguageType)
      ? (i18n.language as LanguageType)
      : 'ko'
  );
  const [isLoading, setIsLoading] = useState(false);

  return (
    <View style={styles.container}>
      <Header title={t('profile.languageChange.title')} onBack={() => router.back()} />
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + layout.screenPaddingBottom }} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Ionicons name="information-circle" size={18} color={colors.text.primary} />
          <Text style={styles.bannerText}>{t('profile.languageChange.warning')}</Text>
        </View>
        <Text style={styles.sectionLabel}>{t('profile.languageChange.title')}</Text>
        <View style={styles.selectorWrap}>
          <LanguageSelector selected={selected} onSelect={setSelected} />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          label={t('profile.languageChange.save')}
          disabled={isLoading}
          onPress={async () => {
            setIsLoading(true);
            try {
              await updateLanguage(toServerLanguageCode(selected));
              await saveLanguage(selected);
              await i18n.changeLanguage(selected);
              router.back();
            } catch {
              Alert.alert(t('common.error'), t('profile.languageChange.saveError'));
            } finally {
              setIsLoading(false);
            }
          }}
        />
      </View>
    </View>
  );
};

export default ProfileLanguageScreen;

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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary[500],
    borderRadius: 15,
    padding: 15,
    marginHorizontal: layout.screenPaddingHorizontal,
    marginTop: 10,
    gap: 11,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#888888',
    paddingLeft: layout.screenPaddingHorizontal,
    marginTop: 16,
    marginBottom: 8,
  },
  selectorWrap: {
    marginHorizontal: layout.screenPaddingHorizontal,
  },
  footer: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: layout.screenPaddingBottom,
    paddingTop: 12,
    backgroundColor: colors.text.white,
  },
});
