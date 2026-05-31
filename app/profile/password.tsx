import { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Header from '../../src/components/common/Header';
import FormField from '../../src/components/auth/FormField';
import PasswordStrengthBar, { getStrength } from '../../src/components/auth/PasswordStrengthBar';
import { PrimaryButton } from '../../src/components/common/Button';
import { validatePassword } from '../../src/validation/auth';
import colors from '../../src/constants/colors';
import layout from '../../src/constants/layout';

const MIN_PASSWORD_STRENGTH = 2;

const ProfilePasswordScreen = () => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const newPasswordError = (() => {
    if (!newPassword) return undefined;
    const err = validatePassword(newPassword, {});
    if (err) return err;
    if (getStrength(newPassword) < MIN_PASSWORD_STRENGTH)
      return t('auth.register.basic.error.passwordWeak');
    return undefined;
  })();

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    newPasswordError === undefined &&
    confirmPassword === newPassword;

  return (
    <View style={styles.container}>
      <Header
        title={t('profile.editProfile.changePassword.title')}
        onBack={() => router.back()}
        onHelp={() => {}}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FormField
          label={t('profile.editProfile.changePassword.currentPassword')}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry={!showCurrent}
          rightIcon={showCurrent ? 'eye-outline' : 'eye-off-outline'}
          onRightIconPress={() => setShowCurrent((prev) => !prev)}
        />

        <FormField
          label={t('profile.editProfile.changePassword.newPassword')}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNew}
          rightIcon={showNew ? 'eye-outline' : 'eye-off-outline'}
          onRightIconPress={() => setShowNew((prev) => !prev)}
          validationState={newPasswordError ? 'error' : undefined}
          validationMessage={newPasswordError}
          bottomElement={
            newPassword.length > 0 && !newPasswordError ? (
              <PasswordStrengthBar password={newPassword} />
            ) : undefined
          }
        />

        <FormField
          label={t('profile.editProfile.changePassword.confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirm}
          rightIcon={showConfirm ? 'eye-outline' : 'eye-off-outline'}
          onRightIconPress={() => setShowConfirm((prev) => !prev)}
          validationState={(() => {
            if (!confirmPassword.length) return undefined;
            return confirmPassword === newPassword ? 'success' : 'error';
          })()}
          validationMessage={(() => {
            if (!confirmPassword.length) return undefined;
            return confirmPassword === newPassword
              ? t('auth.register.basic.passwordMatch')
              : t('auth.register.basic.error.passwordMismatch');
          })()}
        />

        <PrimaryButton
          label={t('profile.editProfile.changePassword.submit')}
          onPress={() =>
            Alert.alert(
              t('common.preparing'),
              t('profile.editProfile.changePassword.preparingMessage')
            )
          }
          disabled={!canSubmit}
        />
      </ScrollView>
    </View>
  );
};

export default ProfilePasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text.white,
    paddingTop: 60,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 24,
  },
});
