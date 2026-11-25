import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateLanguage as updateLanguageApi } from '../../src/api/user';
import { PrimaryButton } from '../../src/components/common/Button';
import Header from '../../src/components/common/Header';
import LanguageSelector from '../../src/components/profile/LanguageSelector';
import colors from '../../src/constants/colors';
import fonts from '../../src/constants/fonts';
import layout from '../../src/constants/layout';
import { saveLanguage, SUPPORTED_LANGUAGES } from '../../src/i18n';
import { queryClient } from '../../src/query/client';
import { useApiMutation } from '../../src/query/hooks';
import { LanguageType, toServerLanguageCode } from '../../src/types/language';
import { assertCurrentSession, getSessionVersion } from '../../src/utils/authSession';

const ProfileLanguageScreen = () => {
  const updateLanguage = useApiMutation(updateLanguageApi);
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + layout.screenPaddingBottom }}
        showsVerticalScrollIndicator={false}
      >
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
            const version = getSessionVersion();
            setIsLoading(true);
            try {
              await updateLanguage(toServerLanguageCode(selected));
              assertCurrentSession(version);
              await saveLanguage(selected);
              assertCurrentSession(version);
              // 서버 언어가 바뀐 뒤 이전 언어의 키로 응답을 저장하거나 재조회하지 않는다.
              const filters = {
                predicate: (query: { queryKey: readonly unknown[] }) =>
                  query.queryKey[1] === version,
              };
              await queryClient.cancelQueries(filters);
              assertCurrentSession(version);
              queryClient.removeQueries(filters);
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
