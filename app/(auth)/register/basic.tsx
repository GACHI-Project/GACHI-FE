import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import StepHeader from '../../../src/components/common/StepHeader';
import { PrimaryButton } from '../../../src/components/common/Button';
import FormField from '../../../src/components/auth/FormField';
import PasswordStrengthBar, { getStrength } from '../../../src/components/auth/PasswordStrengthBar';
import TermsCheckbox from '../../../src/components/auth/TermsCheckbox';
import {
  checkLoginId,
  checkPhoneNumber,
  checkEmail,
  sendEmailVerificationCode,
  verifyEmailCode,
  AuthApiError,
} from '../../../src/api/auth';
import { loginIdSchema, emailSchema, validatePassword } from '../../../src/validation/auth';
import colors from '../../../src/constants/colors';
import fonts from '../../../src/constants/fonts';
import layout from '../../../src/constants/layout';
import { useRegisterStore } from '../../../src/store/registerStore';

type ValidationState = 'success' | 'error' | undefined;

const formatTimer = (seconds: number) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const formatPhoneNumber = (digits: string): string => {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
};

type FormValues = {
  name: string;
  id: string;
  phone: string;
  email: string;
  password: string;
  passwordConfirm: string;
  agreed: boolean;
};

const RegisterBasicScreen = () => {
  const { t } = useTranslation();
  const setBasicInfo = useRegisterStore((s) => s.setBasicInfo);

  const formSchema = z
    .object({
      name: z.string().trim().min(1, t('auth.register.basic.error.nameRequired')),
      id: loginIdSchema,
      phone: z
        .string()
        .refine(
          (v) => /^01[0-9]{8,9}$/.test(v.replace(/-/g, '')),
          t('auth.register.basic.error.phoneFormat')
        ),
      email: emailSchema,
      password: z.string().min(1),
      passwordConfirm: z.string().min(1),
      agreed: z.boolean(),
    })
    .superRefine((data, ctx) => {
      const pwError = validatePassword(data.password, {
        loginId: data.id,
        email: data.email,
        phoneNumber: data.phone.replace(/-/g, ''),
      });
      if (pwError) {
        ctx.addIssue({ code: 'custom', message: pwError, path: ['password'] });
      } else if (getStrength(data.password) < 2) {
        ctx.addIssue({
          code: 'custom',
          message: t('auth.register.basic.error.passwordWeak'),
          path: ['password'],
        });
      }
      if (data.passwordConfirm && data.password !== data.passwordConfirm) {
        ctx.addIssue({
          code: 'custom',
          message: t('auth.register.basic.error.passwordMismatch'),
          path: ['passwordConfirm'],
        });
      }
      if (!data.agreed) {
        ctx.addIssue({
          code: 'custom',
          message: t('auth.register.basic.error.termsRequired'),
          path: ['agreed'],
        });
      }
    });

  const {
    control,
    getValues,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      id: '',
      phone: '',
      email: '',
      password: '',
      passwordConfirm: '',
      agreed: false,
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [emailTimer, setEmailTimer] = useState<number | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const [idValidation, setIdValidation] = useState<ValidationState>();
  const [idMessage, setIdMessage] = useState<string | undefined>();
  const [idChecking, setIdChecking] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<ValidationState>();
  const [phoneMessage, setPhoneMessage] = useState<string | undefined>();
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [emailValidation, setEmailValidation] = useState<ValidationState>();
  const [emailMessage, setEmailMessage] = useState<string | undefined>();
  const [emailChecking, setEmailChecking] = useState(false);
  const [codeValidation, setCodeValidation] = useState<ValidationState>();
  const [codeMessage, setCodeMessage] = useState<string | undefined>();
  const [codeChecking, setCodeChecking] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phoneDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);
    },
    []
  );

  const triggerIdApiCheck = (v: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIdValidation(undefined);
    setIdMessage(undefined);
    setIdChecking(false);

    if (!loginIdSchema.safeParse(v).success) return;

    setIdChecking(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { available } = await checkLoginId(v);
        setIdValidation(available ? 'success' : 'error');
        setIdMessage(
          available
            ? t('auth.register.basic.error.idAvailable')
            : t('auth.register.basic.error.idTaken')
        );
      } catch {
        setIdValidation('error');
        setIdMessage(t('auth.register.basic.error.checkError'));
      } finally {
        setIdChecking(false);
      }
    }, 500);
  };

  const triggerPhoneApiCheck = (digits: string) => {
    if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);
    setPhoneValidation(undefined);
    setPhoneMessage(undefined);
    setPhoneChecking(false);

    if (!/^01[0-9]{8,9}$/.test(digits)) return;

    setPhoneChecking(true);
    phoneDebounceRef.current = setTimeout(async () => {
      try {
        const { available } = await checkPhoneNumber(digits);
        setPhoneValidation(available ? 'success' : 'error');
        setPhoneMessage(
          available
            ? t('auth.register.basic.error.phoneAvailable')
            : t('auth.register.basic.error.phoneTaken')
        );
      } catch {
        setPhoneValidation('error');
        setPhoneMessage(t('auth.register.basic.error.checkError'));
      } finally {
        setPhoneChecking(false);
      }
    }, 500);
  };

  const handleEmailVerify = async () => {
    const email = getValues('email');
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setEmailValidation('error');
      setEmailMessage(emailResult.error.issues[0].message);
      return;
    }

    setEmailChecking(true);
    setEmailValidation(undefined);
    setEmailMessage(undefined);

    try {
      const { available } = await checkEmail(email);
      if (!available) {
        setEmailValidation('error');
        setEmailMessage(t('auth.register.basic.error.emailTaken'));
        return;
      }

      const { codeTtlSeconds } = await sendEmailVerificationCode(email);

      if (timerRef.current) clearInterval(timerRef.current);
      setEmailValidation('success');
      setEmailMessage(t('auth.register.basic.error.codeSent'));
      setEmailSent(true);
      setVerificationCode('');
      setCodeValidation(undefined);
      setCodeMessage(undefined);
      setCodeChecking(false);
      setEmailTimer(codeTtlSeconds - 1);
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
    } catch {
      setEmailValidation('error');
      setEmailMessage(t('auth.register.basic.error.sendError'));
    } finally {
      setEmailChecking(false);
    }
  };

  const handleCodeConfirm = async () => {
    const email = getValues('email');
    const code = verificationCode.trim();

    if (!/^\d{6}$/.test(code)) {
      setCodeValidation('error');
      setCodeMessage(t('auth.register.basic.error.codeFormat'));
      return;
    }

    setCodeChecking(true);
    setCodeValidation(undefined);
    setCodeMessage(undefined);

    try {
      await verifyEmailCode(email, code);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setEmailTimer(null);
      setCodeValidation('success');
      setCodeMessage(t('auth.register.basic.error.emailVerified'));
      setEmailValidation('success');
      setEmailMessage(t('auth.register.basic.error.emailVerified'));
    } catch (error) {
      setCodeValidation('error');

      if (error instanceof AuthApiError) {
        if (error.code === 'COMMON4001') {
          setCodeMessage(t('auth.register.basic.error.codeInvalid'));
        } else if (error.code === 'AUTH4002') {
          setCodeMessage(t('auth.register.basic.error.codeWrong'));
        } else if (error.code === 'AUTH4003') {
          setCodeMessage(t('auth.register.basic.error.codeExpired'));
        } else if (error.code === 'AUTH4292') {
          setCodeMessage(t('auth.register.basic.error.codeExceeded'));
        } else {
          setCodeMessage(t('auth.register.basic.error.verifyError'));
        }
      } else {
        setCodeMessage(t('auth.register.basic.error.verifyError'));
      }
    } finally {
      setCodeChecking(false);
    }
  };

  const passwordValue = watch('password');
  const passwordConfirmValue = watch('passwordConfirm');

  return (
    <View style={styles.container}>
      <StepHeader currentStep={2} totalStep={4} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{t('auth.register.basic.title')}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>{t('auth.register.basic.subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <FormField
                label={t('auth.register.basic.name')}
                value={field.value}
                onChangeText={field.onChange}
                autoCapitalize="words"
              />
            )}
          />

          <Controller
            control={control}
            name="id"
            render={({ field }) => (
              <FormField
                label={t('auth.register.basic.id')}
                value={field.value}
                onChangeText={(v) => {
                  field.onChange(v);
                  triggerIdApiCheck(v);
                }}
                validationState={errors.id ? 'error' : idValidation}
                validationMessage={errors.id?.message ?? idMessage}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <FormField
                label={t('auth.register.basic.phone')}
                value={field.value}
                onChangeText={(v) => {
                  const digits = v.replace(/\D/g, '').slice(0, 11);
                  const formatted = formatPhoneNumber(digits);
                  field.onChange(formatted);
                  triggerPhoneApiCheck(digits);
                }}
                keyboardType="phone-pad"
                placeholder="010-0000-0000"
                validationState={errors.phone ? 'error' : phoneValidation}
                validationMessage={errors.phone?.message ?? phoneMessage}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <FormField
                label={t('auth.register.basic.email')}
                value={field.value}
                onChangeText={(v) => {
                  field.onChange(v);
                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                  }
                  setEmailTimer(null);
                  setEmailSent(false);
                  setVerificationCode('');
                  setCodeValidation(undefined);
                  setCodeMessage(undefined);
                  setEmailValidation(undefined);
                  setEmailMessage(undefined);
                }}
                keyboardType="email-address"
                rightButton={{
                  label: (() => {
                    if (emailChecking) return t('auth.register.basic.verifying');
                    if (emailTimer !== null) return formatTimer(emailTimer);
                    return t('auth.register.basic.verify');
                  })(),
                  onPress: handleEmailVerify,
                  disabled: emailChecking,
                }}
                validationState={errors.email ? 'error' : emailValidation}
                validationMessage={errors.email?.message ?? emailMessage}
              />
            )}
          />

          {emailSent &&
            (() => {
              const isExpired = emailTimer === null && codeValidation !== 'success';
              const codeState: ValidationState = isExpired ? 'error' : codeValidation;
              const codeMsg = isExpired
                ? t('auth.register.basic.error.codeExpiredDisplay')
                : codeMessage;

              return (
                <FormField
                  label={t('auth.register.basic.verificationCode')}
                  value={verificationCode}
                  onChangeText={(v) => {
                    const digitsOnly = v.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(digitsOnly);
                    setCodeValidation(undefined);
                    setCodeMessage(undefined);
                  }}
                  keyboardType="number-pad"
                  rightButton={{
                    label: codeChecking ? t('auth.register.basic.verifying') : t('common.confirm'),
                    onPress: handleCodeConfirm,
                    disabled: codeChecking,
                  }}
                  validationState={codeState}
                  validationMessage={codeMsg}
                />
              );
            })()}

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <FormField
                label={t('auth.register.basic.password')}
                value={field.value}
                onChangeText={field.onChange}
                secureTextEntry={!showPassword}
                rightIcon={showPassword ? 'eye-outline' : 'eye-off-outline'}
                onRightIconPress={() => setShowPassword((prev) => !prev)}
                validationState={passwordValue.length > 0 && errors.password ? 'error' : undefined}
                validationMessage={passwordValue.length > 0 ? errors.password?.message : undefined}
                bottomElement={
                  passwordValue.length > 0 && !errors.password ? (
                    <PasswordStrengthBar password={passwordValue} />
                  ) : undefined
                }
              />
            )}
          />

          <Controller
            control={control}
            name="passwordConfirm"
            render={({ field }) => (
              <FormField
                label={t('auth.register.basic.passwordConfirm')}
                value={field.value}
                onChangeText={field.onChange}
                secureTextEntry={!showPasswordConfirm}
                rightIcon={showPasswordConfirm ? 'eye-outline' : 'eye-off-outline'}
                onRightIconPress={() => setShowPasswordConfirm((prev) => !prev)}
                validationState={(() => {
                  if (!passwordConfirmValue.length) return undefined;
                  return errors.passwordConfirm ? 'error' : 'success';
                })()}
                validationMessage={
                  passwordConfirmValue.length > 0
                    ? (errors.passwordConfirm?.message ?? t('auth.register.basic.passwordMatch'))
                    : undefined
                }
              />
            )}
          />

          <Controller
            control={control}
            name="agreed"
            render={({ field }) => (
              <TermsCheckbox
                checked={field.value}
                onChange={field.onChange}
                onTermsPress={() => router.push('/(auth)/register/terms')}
                onPrivacyPress={() => router.push('/(auth)/register/privacy')}
              />
            )}
          />
        </View>

        <PrimaryButton
          label={t('common.next')}
          onPress={() => {
            const values = getValues();
            setBasicInfo({
              loginId: values.id,
              password: values.password,
              name: values.name,
              email: values.email,
              phoneNumber: values.phone.replace(/-/g, ''),
            });
            router.push('/(auth)/register/child');
          }}
          disabled={
            !isValid ||
            idChecking ||
            idValidation !== 'success' ||
            phoneChecking ||
            phoneValidation !== 'success' ||
            codeValidation !== 'success' ||
            emailChecking
          }
        />

        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginText}>
            {t('auth.register.basic.hasAccount')}{'  '}
            <Text style={styles.loginLink}>{t('auth.register.basic.loginLink')}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default RegisterBasicScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text.white,
    paddingTop: 60,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: 24,
    paddingBottom: layout.screenPaddingBottom,
    gap: 24,
  },
  titleSection: {
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  badge: {
    backgroundColor: colors.secondary[400],
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
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
  loginText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  loginLink: {
    fontFamily: fonts.semiBold,
    color: colors.primary[500],
  },
});
