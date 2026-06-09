import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Header from '../../src/components/common/Header';
import FormField from '../../src/components/auth/FormField';
import PasswordStrengthBar, { getStrength } from '../../src/components/auth/PasswordStrengthBar';
import { PrimaryButton } from '../../src/components/common/Button';
import { validatePassword } from '../../src/validation/auth';
import { fetchMyInfo, UserInfo, changePassword, UserApiError } from '../../src/api/user';
import colors from '../../src/constants/colors';
import fonts from '../../src/constants/fonts';
import layout from '../../src/constants/layout';

const MIN_PASSWORD_STRENGTH = 2;

const ProfilePasswordScreen = () => {
  const { t } = useTranslation();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState<string | undefined>(undefined);
  const [userInfoFetchFailed, setUserInfoFetchFailed] = useState(false);
  const isSubmitting = useRef(false);

  const loadUserInfo = useCallback(async () => {
    setUserInfoFetchFailed(false);
    try {
      const info = await fetchMyInfo();
      setUserInfo(info);
    } catch (error) {
      if (error instanceof UserApiError && error.code === 'UNAUTHORIZED') {
        router.replace('/(auth)/login');
        return;
      }
      setUserInfoFetchFailed(true);
    }
  }, []);

  useEffect(() => {
    loadUserInfo();
  }, [loadUserInfo]);

  const newPasswordError = (() => {
    if (!newPassword) return undefined;
    const err = validatePassword(newPassword, {
      loginId: userInfo?.loginId,
      email: userInfo?.email,
      phoneNumber: userInfo?.phoneNumber,
    });
    if (err) return err;
    if (getStrength(newPassword) < MIN_PASSWORD_STRENGTH)
      return t('auth.register.basic.error.passwordWeak');
    return undefined;
  })();

  const canSubmit =
    userInfo !== null &&
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
        {userInfoFetchFailed && (
          <TouchableOpacity style={styles.fetchErrorRow} onPress={loadUserInfo}>
            <Text style={styles.fetchErrorText}>
              {t('profile.editProfile.changePassword.userInfoFetchError')}
            </Text>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        )}

        <FormField
          label={t('profile.editProfile.changePassword.currentPassword')}
          value={currentPassword}
          onChangeText={(text) => {
            setCurrentPassword(text);
            setCurrentPasswordError(undefined);
          }}
          secureTextEntry={!showCurrent}
          rightIcon={showCurrent ? 'eye-outline' : 'eye-off-outline'}
          onRightIconPress={() => setShowCurrent((prev) => !prev)}
          validationState={currentPasswordError ? 'error' : undefined}
          validationMessage={currentPasswordError}
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
          onPress={async () => {
            if (isSubmitting.current) return;
            isSubmitting.current = true;
            setIsLoading(true);
            try {
              await changePassword({
                currentPassword,
                newPassword,
                newPasswordConfirm: confirmPassword,
              });
              router.back();
            } catch (error) {
              if (error instanceof UserApiError && error.code === 'AUTH4011') {
                setCurrentPasswordError(
                  t('profile.editProfile.changePassword.errorCurrentPassword')
                );
              } else if (error instanceof UserApiError && error.code === 'UNAUTHORIZED') {
                router.replace('/(auth)/login');
              } else {
                Alert.alert('', t('profile.editProfile.changePassword.errorGeneral'));
              }
            } finally {
              setIsLoading(false);
              isSubmitting.current = false;
            }
          }}
          disabled={!canSubmit || isLoading}
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
  fetchErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
  fetchErrorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text.red,
  },
  retryText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.primary[400],
    marginLeft: 8,
  },
});
