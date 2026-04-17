import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const formSchema = z
  .object({
    name: z.string().trim().min(1, '이름을 입력해주세요'),
    id: loginIdSchema,
    phone: z
      .string()
      .refine((v) => /^01[0-9]{8,9}$/.test(v.replace(/-/g, '')), '올바른 전화번호 형식이 아니에요'),
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
        message: '비밀번호 보안 강도가 위험 등급이에요',
        path: ['password'],
      });
    }
    if (data.passwordConfirm && data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: 'custom',
        message: '비밀번호가 일치하지 않아요',
        path: ['passwordConfirm'],
      });
    }
    if (!data.agreed) {
      ctx.addIssue({
        code: 'custom',
        message: '약관에 동의해주세요',
        path: ['agreed'],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

const RegisterBasicScreen = () => {
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
        setIdMessage(available ? '사용 가능한 아이디에요' : '이미 사용 중인 아이디에요');
      } catch {
        setIdValidation('error');
        setIdMessage('확인 중 오류가 발생했어요. 다시 시도해주세요.');
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
        setPhoneMessage(available ? '사용 가능한 전화번호에요' : '이미 사용 중인 전화번호에요');
      } catch {
        setPhoneValidation('error');
        setPhoneMessage('확인 중 오류가 발생했어요. 다시 시도해주세요.');
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
        setEmailMessage('이미 사용 중인 이메일이에요');
        return;
      }

      const { codeTtlSeconds } = await sendEmailVerificationCode(email);

      if (timerRef.current) clearInterval(timerRef.current);
      setEmailValidation('success');
      setEmailMessage('인증 코드가 발송됐어요');
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
      setEmailMessage('인증 코드 발송에 실패했어요. 다시 시도해주세요.');
    } finally {
      setEmailChecking(false);
    }
  };

  const handleCodeConfirm = async () => {
    const email = getValues('email');
    const code = verificationCode.trim();

    if (!/^\d{6}$/.test(code)) {
      setCodeValidation('error');
      setCodeMessage('인증 코드는 6자리 숫자여야 해요');
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
      setCodeMessage('이메일 인증이 완료되었어요');
      setEmailValidation('success');
      setEmailMessage('이메일 인증이 완료되었어요');
    } catch (error) {
      setCodeValidation('error');

      if (error instanceof AuthApiError) {
        if (error.code === 'COMMON4001') {
          setCodeMessage('입력값이 올바르지 않아요');
        } else if (error.code === 'AUTH4002') {
          setCodeMessage('인증 코드가 일치하지 않아요');
        } else if (error.code === 'AUTH4003') {
          setCodeMessage('인증 코드가 만료되었어요. 다시 발송해주세요.');
        } else if (error.code === 'AUTH4292') {
          setCodeMessage('인증 코드 입력 시도 횟수를 초과했어요.');
        } else {
          setCodeMessage('인증 확인에 실패했어요. 다시 시도해주세요.');
        }
      } else {
        setCodeMessage('인증 확인에 실패했어요. 다시 시도해주세요.');
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
            <Text style={styles.title}>새로운 계정 만들기</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>간단한 프로필 설정 후 바로 시작할 수 있어요.</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <FormField
                label="이름"
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
                label="아이디"
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
                label="전화번호"
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
                label="이메일"
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
                    if (emailChecking) return '확인 중...';
                    if (emailTimer !== null) return formatTimer(emailTimer);
                    return '인증하기';
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
              const codeMsg = isExpired ? '인증 시간이 만료됐어요. 재발송해주세요.' : codeMessage;

              return (
                <FormField
                  label="인증번호"
                  value={verificationCode}
                  onChangeText={(v) => {
                    const digitsOnly = v.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(digitsOnly);
                    setCodeValidation(undefined);
                    setCodeMessage(undefined);
                  }}
                  keyboardType="number-pad"
                  rightButton={{
                    label: codeChecking ? '확인 중...' : '확인',
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
                label="비밀번호"
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
                label="비밀번호 확인"
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
                    ? (errors.passwordConfirm?.message ?? '비밀번호가 일치합니다.')
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
          label="다음으로 →"
          onPress={() => router.push('/(auth)/register/child')}
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
            이미 계정이 있으신가요?{'  '}
            <Text style={styles.loginLink}>로그인</Text>
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
