import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../src/components/common/Header';
import FormField from '../../src/components/auth/FormField';
import { emailSchema } from '../../src/validation/auth';
import {
  sendEmailChangeCode,
  verifyEmailChangeCode,
  changeEmail,
  UserApiError,
} from '../../src/api/user';
import colors from '../../src/constants/colors';
import fonts from '../../src/constants/fonts';
import layout from '../../src/constants/layout';

const formatTimer = (seconds: number) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const EditEmailScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [emailValidation, setEmailValidation] = useState<'success' | 'error' | undefined>();
  const [emailMessage, setEmailMessage] = useState<string | undefined>();
  const [emailSent, setEmailSent] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailTimer, setEmailTimer] = useState<number | null>(null);

  const [code, setCode] = useState('');
  const [codeValidation, setCodeValidation] = useState<'success' | 'error' | undefined>();
  const [codeMessage, setCodeMessage] = useState<string | undefined>();
  const [codeVerified, setCodeVerified] = useState(false);
  const [codeChecking, setCodeChecking] = useState(false);

  const [saving, setSaving] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    []
  );

  const handleEmailVerify = async () => {
    const emailResult = emailSchema.safeParse(email.trim());
    if (!emailResult.success) {
      setEmailValidation('error');
      setEmailMessage(emailResult.error.issues[0].message);
      return;
    }

    setEmailChecking(true);
    setEmailValidation(undefined);
    setEmailMessage(undefined);

    try {
      const { codeTtlSeconds } = await sendEmailChangeCode(email.trim(), currentPassword);

      if (timerRef.current) clearInterval(timerRef.current);
      setEmailValidation('success');
      setEmailMessage(t('auth.register.basic.error.codeSent'));
      setEmailSent(true);
      setCode('');
      setCodeValidation(undefined);
      setCodeMessage(undefined);
      setCodeVerified(false);
      setEmailTimer(codeTtlSeconds);
      timerRef.current = setInterval(() => {
        setEmailTimer((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      setEmailValidation('error');
      if (e instanceof UserApiError) {
        switch (e.code) {
          case 'AUTH4011':
            setEmailMessage(t('profile.editEmail.wrongPassword'));
            break;
          case 'AUTH4091':
            setEmailMessage(t('profile.editEmail.emailAlreadyUsed'));
            break;
          default:
            setEmailMessage(t('auth.register.basic.error.sendError'));
        }
      } else {
        setEmailMessage(t('auth.register.basic.error.sendError'));
      }
    } finally {
      setEmailChecking(false);
    }
  };

  const handleCodeConfirm = async () => {
    if (!code.trim()) return;

    setCodeChecking(true);
    setCodeValidation(undefined);
    setCodeMessage(undefined);

    try {
      await verifyEmailChangeCode(email.trim(), code.trim());
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setEmailTimer(null);
      setCodeVerified(true);
      setCodeValidation('success');
      setCodeMessage(t('auth.register.basic.error.emailVerified'));
    } catch {
      setCodeValidation('error');
      setCodeMessage(t('profile.editEmail.codeInvalid'));
    } finally {
      setCodeChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!codeVerified || saving) return;

    setSaving(true);
    try {
      await changeEmail(email.trim());
      router.back();
    } catch (e) {
      Alert.alert(
        t('common.error'),
        e instanceof Error ? e.message : t('profile.editEmail.saveFailed')
      );
    } finally {
      setSaving(false);
    }
  };

  const canVerify =
    emailSchema.safeParse(email.trim()).success && currentPassword.length > 0 && !emailChecking;
  const canConfirm = code.trim().length > 0 && !codeChecking && !codeVerified;

  return (
    <View style={styles.container}>
      <Header title={t('profile.editEmail.title')} onBack={() => router.back()} onHelp={() => {}} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FormField
          label={t('profile.editProfile.changePassword.currentPassword')}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder={t('profile.editEmail.currentPasswordPlaceholder')}
          secureTextEntry={!showPassword}
          rightIcon={showPassword ? 'eye-outline' : 'eye-off-outline'}
          onRightIconPress={() => setShowPassword((prev) => !prev)}
          editable={!codeVerified}
        />

        <FormField
          label={t('profile.editEmail.newEmail')}
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setEmailValidation(undefined);
            setEmailMessage(undefined);
          }}
          placeholder={t('auth.register.basic.email')}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!codeVerified}
          rightButton={{
            label: emailChecking
              ? t('auth.register.basic.verifying')
              : t('auth.register.basic.verify'),
            onPress: handleEmailVerify,
            disabled: !canVerify,
          }}
          validationMessage={emailMessage}
          validationState={emailValidation}
        />

        {emailSent && (
          <FormField
            label={t('auth.register.basic.verificationCode')}
            value={code}
            onChangeText={(v) => {
              setCode(v);
              setCodeValidation(undefined);
              setCodeMessage(undefined);
            }}
            placeholder="000000"
            keyboardType="number-pad"
            editable={!codeVerified}
            rightButton={{
              label: codeChecking ? t('auth.register.basic.verifying') : t('common.confirm'),
              onPress: handleCodeConfirm,
              disabled: !canConfirm,
            }}
            validationMessage={codeMessage}
            validationState={codeValidation}
            bottomElement={
              emailTimer !== null ? (
                <Text style={styles.timer}>{formatTimer(emailTimer)}</Text>
              ) : undefined
            }
          />
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + layout.screenPaddingBottom }]}>
        <TouchableOpacity
          style={[styles.submitBtn, !codeVerified && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!codeVerified || saving}
          activeOpacity={0.8}
        >
          <Text style={styles.submitBtnText}>
            {saving ? t('common.saving') : t('profile.editEmail.submit')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EditEmailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text.white,
    paddingTop: 60,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: layout.screenPaddingTop,
    gap: 20,
    paddingBottom: 24,
  },
  timer: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.primary[500],
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: layout.screenPaddingBottom,
    paddingTop: 12,
    backgroundColor: colors.text.white,
  },
  submitBtn: {
    height: 55,
    borderRadius: 12,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: colors.gray[200],
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text.white,
  },
});
