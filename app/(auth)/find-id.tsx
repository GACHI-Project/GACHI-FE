import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import FormField from '../../src/components/auth/FormField';
import { PrimaryButton } from '../../src/components/common/Button';
import {
  sendEmailVerificationCode,
  verifyEmailCode,
  findLoginId,
  AuthApiError,
} from '../../src/api/auth';
import colors from '../../src/constants/colors';
import fonts from '../../src/constants/fonts';
import layout from '../../src/constants/layout';

type ValidationMsg = { text: string; state: 'success' | 'error' };

const FindIdScreen = () => {
  const { t } = useTranslation();

  const [step, setStep] = useState<'form' | 'found'>('form');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [foundId, setFoundId] = useState('');

  const [codeSent, setCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailMsg, setEmailMsg] = useState<ValidationMsg | null>(null);
  const [codeMsg, setCodeMsg] = useState<ValidationMsg | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!email || sending) return;
    setSending(true);
    setEmailMsg(null);
    setCodeMsg(null);
    setCode('');
    setCodeSent(false);
    setEmailVerified(false);
    try {
      await sendEmailVerificationCode(email.trim().toLowerCase());
      setCodeSent(true);
      setEmailMsg({ text: t('auth.register.basic.error.codeSent'), state: 'success' });
    } catch {
      setEmailMsg({ text: t('auth.register.basic.error.sendError'), state: 'error' });
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

  const handleFindId = async () => {
    if (!emailVerified || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await findLoginId(email);
      setFoundId(result.loginId);
      setStep('found');
    } catch {
      setErrorMsg(t('auth.findId.error.generic'));
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
          <Text style={styles.title}>{t('auth.findId.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.findId.subtitle')}</Text>
        </View>

        {step === 'found' ? (
          <View style={styles.form}>
            <View style={styles.checkCircleWrap}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={40} color={colors.text.white} />
              </View>
              <Text style={styles.foundTitle}>{t('auth.findId.foundTitle')}</Text>
              <Text style={styles.foundDesc}>{t('auth.findId.foundDesc')}</Text>
            </View>

            <View style={styles.idCard}>
              <Text style={styles.idCardLabel}>{t('auth.findId.idLabel')}</Text>
              <Text style={styles.idCardValue}>{foundId}</Text>
            </View>

            <PrimaryButton
              label={t('auth.findId.goLogin')}
              onPress={() => router.replace('/(auth)/login')}
            />

            <TouchableOpacity
              onPress={() => router.replace('/(auth)/find-password')}
              accessibilityRole="button"
              accessibilityLabel={t('auth.findId.goFindPassword')}
            >
              <Text style={styles.linkText}>
                {t('auth.findId.forgotPassword')}
                {'  '}
                <Text style={styles.linkHighlight}>{t('auth.findId.goFindPassword')}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <FormField
              label={t('auth.findId.email')}
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
                label: sending ? t('auth.findId.sending') : t('auth.findId.send'),
                onPress: handleSendCode,
                disabled: !email || sending,
              }}
              validationMessage={emailMsg?.text}
              validationState={emailMsg?.state}
            />

            {codeSent && (
              <FormField
                label={t('auth.findId.code')}
                value={code}
                onChangeText={(v) => {
                  setCode(v);
                  setCodeMsg(null);
                }}
                keyboardType="number-pad"
                rightButton={{
                  label: verifying ? t('auth.findId.verifying') : t('auth.findId.confirm'),
                  onPress: handleVerifyCode,
                  disabled: !code || verifying || emailVerified,
                }}
                validationMessage={codeMsg?.text}
                validationState={codeMsg?.state}
              />
            )}

            {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

            <PrimaryButton
              label={loading ? t('auth.findId.loading') : t('auth.findId.submit')}
              onPress={handleFindId}
              disabled={!emailVerified || loading}
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/find-password')}
              accessibilityRole="button"
              accessibilityLabel={t('auth.findId.goFindPassword')}
            >
              <Text style={styles.linkText}>
                {t('auth.findId.forgotPassword')}
                {'  '}
                <Text style={styles.linkHighlight}>{t('auth.findId.goFindPassword')}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default FindIdScreen;

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
  foundTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  foundDesc: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  idCard: {
    width: '100%',
    backgroundColor: colors.primary[0],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[200],
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 4,
  },
  idCardLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  idCardValue: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.primary[500],
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
