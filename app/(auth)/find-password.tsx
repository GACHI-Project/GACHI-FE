import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import FormField from '../../src/components/auth/FormField';
import { PrimaryButton } from '../../src/components/common/Button';
import { sendFindPasswordCode, verifyEmailCode, AuthApiError } from '../../src/api/auth';
import colors from '../../src/constants/colors';
import fonts from '../../src/constants/fonts';
import layout from '../../src/constants/layout';

type ValidationMsg = { text: string; state: 'success' | 'error' };

const FindPasswordScreen = () => {
  const { t } = useTranslation();

  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  const [codeSent, setCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [idMsg, setIdMsg] = useState<ValidationMsg | null>(null);
  const [emailMsg, setEmailMsg] = useState<ValidationMsg | null>(null);
  const [codeMsg, setCodeMsg] = useState<ValidationMsg | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!loginId || !email || sending) return;
    setSending(true);
    setIdMsg(null);
    setEmailMsg(null);
    setCodeMsg(null);
    setCode('');
    setCodeSent(false);
    setEmailVerified(false);
    setErrorMsg(null);
    try {
      await sendFindPasswordCode(loginId, email);
      setCodeSent(true);
      setIdMsg({ text: t('auth.findPassword.idFound'), state: 'success' });
      setEmailMsg({ text: t('auth.register.basic.error.codeSent'), state: 'success' });
    } catch (e) {
      if (e instanceof AuthApiError) {
        setErrorMsg(t('auth.findPassword.error.generic'));
      } else {
        setErrorMsg(t('common.networkError'));
      }
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || verifying || emailVerified) return;
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setCodeMsg({ text: t('auth.register.basic.error.codeFormat'), state: 'error' });
      return;
    }
    setVerifying(true);
    setCodeMsg(null);
    try {
      await verifyEmailCode(email, code);
      setEmailVerified(true);
      setCodeMsg({ text: t('auth.register.basic.error.emailVerified'), state: 'success' });
    } catch (e) {
      if (e instanceof AuthApiError) {
        if (e.code === 'AUTH4221')
          setCodeMsg({ text: t('auth.register.basic.error.codeWrong'), state: 'error' });
        else if (e.code === 'AUTH4291')
          setCodeMsg({ text: t('auth.register.basic.error.codeExpired'), state: 'error' });
        else if (e.code === 'AUTH4292')
          setCodeMsg({ text: t('auth.register.basic.error.codeExceeded'), state: 'error' });
        else setCodeMsg({ text: t('auth.register.basic.error.verifyError'), state: 'error' });
      } else {
        setCodeMsg({ text: t('auth.register.basic.error.verifyError'), state: 'error' });
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = () => {
    if (!emailVerified) return;
    router.push({ pathname: '/(auth)/reset-password', params: { loginId } });
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
          <Text style={styles.title}>{t('auth.findPassword.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.findPassword.subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <FormField
            label={t('auth.findPassword.id')}
            value={loginId}
            onChangeText={(v) => {
              setLoginId(v);
              setIdMsg(null);
              setErrorMsg(null);
              setCodeSent(false);
              setEmailVerified(false);
            }}
            validationMessage={idMsg?.text}
            validationState={idMsg?.state}
          />

          <FormField
            label={t('auth.findPassword.email')}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setEmailMsg(null);
              setErrorMsg(null);
              setCodeSent(false);
              setEmailVerified(false);
            }}
            keyboardType="email-address"
            rightButton={{
              label: sending ? t('auth.findPassword.sending') : t('auth.findPassword.send'),
              onPress: handleSendCode,
              disabled: !loginId || !email || sending,
            }}
            validationMessage={emailMsg?.text}
            validationState={emailMsg?.state}
          />

          {codeSent && (
            <FormField
              label={t('auth.findPassword.code')}
              value={code}
              onChangeText={(v) => {
                setCode(v);
                setCodeMsg(null);
              }}
              keyboardType="number-pad"
              rightButton={{
                label: verifying
                  ? t('auth.findPassword.verifying')
                  : t('auth.findPassword.confirm'),
                onPress: handleVerifyCode,
                disabled: !code || verifying || emailVerified,
              }}
              validationMessage={codeMsg?.text}
              validationState={codeMsg?.state}
            />
          )}

          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

          <PrimaryButton
            label={t('auth.findPassword.submit')}
            onPress={handleSubmit}
            disabled={!emailVerified}
          />

          <TouchableOpacity
            onPress={() => router.push('/(auth)/find-id')}
            accessibilityRole="button"
            accessibilityLabel={t('auth.findPassword.goFindId')}
          >
            <Text style={styles.linkText}>
              {t('auth.findPassword.forgotId')}
              {'  '}
              <Text style={styles.linkHighlight}>{t('auth.findPassword.goFindId')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default FindPasswordScreen;

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
    gap: 30,
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
  errorText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.red,
    textAlign: 'center',
  },
  linkText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.primary,
    textAlign: 'center',
  },
  linkHighlight: {
    fontFamily: fonts.semiBold,
    color: colors.primary[500],
  },
});
