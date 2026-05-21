import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import colors from '../../../src/constants/colors';
import fonts from '../../../src/constants/fonts';
import termsKo from '../../../src/i18n/legal/terms.ko';
import termsEn from '../../../src/i18n/legal/terms.en';

const TermsScreen = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const termsText = i18n.language === 'ko' ? termsKo : termsEn;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.terms.title')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.text}>{termsText}</Text>
      </ScrollView>

      <Pressable style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>{t('auth.terms.confirm')}</Text>
      </Pressable>
    </View>
  );
};

export default TermsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.text.white },

  header: {
    paddingTop: 60,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: colors.gray[200],
  },

  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },

  content: {
    padding: 20,
  },

  text: {
    fontSize: 14,
    lineHeight: 24,
    color: colors.text.secondary,
    fontFamily: fonts.regular,
    paddingBottom: 40,
  },

  button: {
    margin: 20,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: colors.text.white,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
});
