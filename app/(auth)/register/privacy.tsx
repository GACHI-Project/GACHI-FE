import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import colors from '../../../src/constants/colors';
import fonts from '../../../src/constants/fonts';
import privacyKo from '../../../src/i18n/legal/privacy.ko';
import privacyEn from '../../../src/i18n/legal/privacy.en';
import { useRegisterStore } from '../../../src/store/registerStore';

const PrivacyScreen = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const setAgreedToTerms = useRegisterStore((s) => s.setAgreedToTerms);

  const privacyText = i18n.language === 'ko' ? privacyKo : privacyEn;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.privacy.title')}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.body}>{privacyText}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.button}
          onPress={() => {
            setAgreedToTerms(true);
            router.back();
          }}
        >
          <Text style={styles.buttonText}>{t('auth.privacy.confirm')}</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default PrivacyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text.white,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  body: {
    fontSize: 14,
    lineHeight: 24,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  button: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.text.white,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
});
