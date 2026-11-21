import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import StepHeader from '../../../src/components/common/StepHeader';
import { PrimaryButton } from '../../../src/components/common/Button';
import FormField from '../../../src/components/auth/FormField';
import PasswordStrengthBar, { getStrength } from '../../../src/components/auth/PasswordStrengthBar';
import TermsCheckbox from '../../../src/components/auth/TermsCheckbox';
import useRegisterAvailability from '../../../src/hooks/auth/useRegisterAvailability';
import useRegisterEmailVerification from '../../../src/hooks/auth/useRegisterEmailVerification';
import { loginIdSchema, emailSchema, validatePassword } from '../../../src/validation/auth';
import colors from '../../../src/constants/colors';
import fonts from '../../../src/constants/fonts';
import layout from '../../../src/constants/layout';
import { useRegisterStore } from '../../../src/store/registerStore';

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
  const agreedToTerms = useRegisterStore((s) => s.agreedToTerms);
  const setAgreedToTerms = useRegisterStore((s) => s.setAgreedToTerms);

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
    setValue,
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

  useFocusEffect(
    useCallback(() => {
      if (agreedToTerms) {
        setValue('agreed', true, { shouldValidate: true });
        setAgreedToTerms(false);
      }
    }, [agreedToTerms, setValue, setAgreedToTerms])
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const idCheck = useRegisterAvailability('id');
  const phoneCheck = useRegisterAvailability('phone');
  const emailVerification = useRegisterEmailVerification();
  const {
    emailTimer,
    emailSent,
    verificationCode,
    emailValidation,
    emailMessageKey,
    emailChecking,
    codeValidation,
    codeMessageKey,
    codeChecking,
  } = emailVerification;

  const [idValue, phoneValue, emailValue, passwordValue, passwordConfirmValue] = useWatch({
    control,
    name: ['id', 'phone', 'email', 'password', 'passwordConfirm'],
  });

  const canContinue =
    isValid &&
    idCheck.isAvailable(idValue) &&
    phoneCheck.isAvailable(phoneValue.replace(/-/g, '')) &&
    emailVerification.isVerified(emailValue) &&
    !emailChecking;

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
                  idCheck.check(v);
                }}
                validationState={errors.id ? 'error' : idCheck.validation}
                validationMessage={
                  errors.id?.message ?? (idCheck.messageKey ? t(idCheck.messageKey) : undefined)
                }
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
                  phoneCheck.check(digits);
                }}
                keyboardType="phone-pad"
                placeholder="010-0000-0000"
                validationState={errors.phone ? 'error' : phoneCheck.validation}
                validationMessage={
                  errors.phone?.message ??
                  (phoneCheck.messageKey ? t(phoneCheck.messageKey) : undefined)
                }
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
                  emailVerification.updateEmail(v);
                }}
                keyboardType="email-address"
                rightButton={{
                  label: (() => {
                    if (emailChecking) return t('auth.register.basic.verifying');
                    if (emailTimer !== null) return formatTimer(emailTimer);
                    return t('auth.register.basic.verify');
                  })(),
                  onPress: () => void emailVerification.send(getValues('email')),
                  disabled: emailChecking,
                }}
                validationState={errors.email ? 'error' : emailValidation}
                validationMessage={
                  errors.email?.message ?? (emailMessageKey ? t(emailMessageKey) : undefined)
                }
              />
            )}
          />

          {emailSent &&
            (() => {
              const isExpired =
                emailTimer === null && !codeChecking && codeValidation !== 'success';
              const codeState = isExpired ? 'error' : codeValidation;
              const translatedCodeMessage = codeMessageKey ? t(codeMessageKey) : undefined;
              const codeMsg = isExpired
                ? t('auth.register.basic.error.codeExpiredDisplay')
                : translatedCodeMessage;

              return (
                <FormField
                  label={t('auth.register.basic.verificationCode')}
                  value={verificationCode}
                  onChangeText={(v) => {
                    emailVerification.updateCode(v);
                  }}
                  keyboardType="number-pad"
                  rightButton={{
                    label: codeChecking ? t('auth.register.basic.verifying') : t('common.confirm'),
                    onPress: () => void emailVerification.confirm(getValues('email')),
                    disabled: codeChecking || emailChecking,
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
            const result = formSchema.safeParse(getValues());
            if (!result.success) return;
            const values = result.data;
            if (
              !idCheck.canSubmit(values.id) ||
              !phoneCheck.canSubmit(values.phone.replace(/-/g, '')) ||
              !emailVerification.canSubmit(values.email)
            ) {
              return;
            }
            setBasicInfo({
              loginId: values.id,
              password: values.password,
              name: values.name,
              email: values.email,
              phoneNumber: values.phone.replace(/-/g, ''),
            });
            router.push('/(auth)/register/child');
          }}
          disabled={!canContinue}
        />

        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginText}>
            {t('auth.register.basic.hasAccount')}
            {'  '}
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
    flex: 1,
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
