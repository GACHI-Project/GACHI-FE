import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import FormField from '../../src/components/auth/FormField';
import PasswordStrengthBar, { getStrength } from '../../src/components/auth/PasswordStrengthBar';
import { PrimaryButton } from '../../src/components/common/Button';
import { resetPassword } from '../../src/api/auth';
import colors from '../../src/constants/colors';
import fonts from '../../src/constants/fonts';
import layout from '../../src/constants/layout';

const ResetPasswordScreen = () => {
  const { t } = useTranslation();
  const { loginId } = useLocalSearchParams<{ loginId: string }>();

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const strength = getStrength(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  let confirmMsg: { text: string; state: 'success' | 'error' } | null = null;
  if (confirmPassword.length > 0) {
    confirmMsg = passwordsMatch
      ? { text: t('auth.resetPassword.passwordMatch'), state: 'success' as const }
      : { text: t('auth.resetPassword.error.passwordMismatch'), state: 'error' as const };
  }

  const canSubmit = strength > 1 && passwordsMatch && !!loginId;

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await resetPassword(loginId, newPassword, confirmPassword);
      setStep('success');
    } catch {
      setErrorMsg(t('auth.resetPassword.error.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <Ionicons name="chevron-back" size={18} color={colors.gray[300]} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('auth.resetPassword.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.resetPassword.subtitle')}</Text>
        </View>

        {step === 'success' ? (
          <View style={styles.form}>
            <View style={styles.checkCircleWrap}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={40} color={colors.text.white} />
              </View>
              <Text style={styles.successTitle}>{t('auth.resetPassword.successTitle')}</Text>
              <Text style={styles.successDesc}>{t('auth.resetPassword.successDesc')}</Text>
            </View>

            <PrimaryButton
              label={t('auth.resetPassword.goLogin')}
              onPress={() => router.replace('/(auth)/login')}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <FormField
              label={t('auth.resetPassword.newPassword')}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              rightIcon={showNew ? 'eye-outline' : 'eye-off-outline'}
              onRightIconPress={() => setShowNew((v) => !v)}
              bottomElement={<PasswordStrengthBar password={newPassword} />}
            />

            <FormField
              label={t('auth.resetPassword.newPasswordConfirm')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              rightIcon={showConfirm ? 'eye-outline' : 'eye-off-outline'}
              onRightIconPress={() => setShowConfirm((v) => !v)}
              validationMessage={confirmMsg?.text}
              validationState={confirmMsg?.state}
            />

            {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

            <PrimaryButton
              label={loading ? t('auth.resetPassword.submitting') : t('auth.resetPassword.submit')}
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ResetPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text.white,
    paddingTop: layout.screenHeaderOffset,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: layout.screenPaddingHorizontal,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: layout.screenPaddingTop,
    paddingBottom: layout.screenPaddingBottom,
    gap: 24,
  },
  titleSection: {
    gap: 6,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  form: {
    gap: 18,
  },
  checkCircleWrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.red,
    textAlign: 'center',
  },
});
