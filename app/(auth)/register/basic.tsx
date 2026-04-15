import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import StepHeader from '../../../src/components/common/StepHeader';
import { PrimaryButton } from '../../../src/components/common/Button';
import FormField from '../../../src/components/auth/FormField';
import PasswordStrengthBar, { getStrength } from '../../../src/components/auth/PasswordStrengthBar';
import TermsCheckbox from '../../../src/components/auth/TermsCheckbox';
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

const MESSAGES: Record<string, Record<string, string>> = {
  id: { success: '사용 가능한 아이디에요', error: '아이디는 4자 이상이어야 해요' },
  phone: { success: '사용 가능한 전화번호에요', error: '이미 등록된 전화번호입니다.' },
  email: { success: '사용 가능한 이메일이에요', error: '올바른 이메일 형식이 아니에요' },
  code: { error: '인증 코드는 6자리 숫자여야 해요' },
  codeExpired: { error: '인증 시간이 만료됐어요. 재발송해주세요.' },
  passwordConfirmSuccess: { success: '비밀번호가 일치합니다.' },
  passwordConfirmError: { error: '비밀번호가 일치하지 않아요' },
};

const getMessage = (key: string, state: ValidationState) =>
  state ? MESSAGES[key]?.[state] : undefined;

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v: string) => /^01[0-9]{8,9}$/.test(v.replace(/-/g, ''));

const RegisterBasicScreen = () => {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emailTimer, setEmailTimer] = useState<number | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [idValidation, setIdValidation] = useState<ValidationState>();
  const [phoneValidation, setPhoneValidation] = useState<ValidationState>();
  const [emailValidation, setEmailValidation] = useState<ValidationState>();
  const [codeValidation, setCodeValidation] = useState<ValidationState>();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    []
  );

  const handleIdChange = (v: string) => {
    setId(v);
    let idState: ValidationState;
    if (v.length >= 4) idState = 'success';
    else if (v.length > 0) idState = 'error';
    setIdValidation(idState);
  };

  const handlePhoneChange = (v: string) => {
    setPhone(v);
    let phoneState: ValidationState;
    if (v.length > 0) phoneState = isValidPhone(v) ? 'success' : 'error';
    setPhoneValidation(phoneState);
  };

  const handleEmailChange = (v: string) => {
    setEmail(v);
    if (timerRef.current) clearInterval(timerRef.current);
    setEmailTimer(null);
    setEmailSent(false);
    setVerificationCode('');
    setCodeValidation(undefined);
    setEmailValidation(undefined);
  };

  const handleEmailVerify = () => {
    if (!isValidEmail(email)) {
      setEmailValidation('error');
      return;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setEmailValidation('success');
    setEmailSent(true);
    setVerificationCode('');
    setCodeValidation(undefined);
    setEmailTimer(179);
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
  };

  const handleCodeConfirm = () => {
    setCodeValidation(/^\d{6}$/.test(verificationCode) ? 'success' : 'error');
  };

  let passwordConfirmValidation: ValidationState;
  if (passwordConfirm.length > 0) {
    passwordConfirmValidation = password === passwordConfirm ? 'success' : 'error';
  }

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
          <FormField label="이름" value={name} onChangeText={setName} autoCapitalize="words" />

          <FormField
            label="아이디"
            value={id}
            onChangeText={handleIdChange}
            validationState={idValidation}
            validationMessage={getMessage('id', idValidation)}
          />

          <FormField
            label="전화번호"
            value={phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            placeholder="010-0000-0000"
            validationState={phoneValidation}
            validationMessage={getMessage('phone', phoneValidation)}
          />

          <FormField
            label="이메일"
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            rightButton={{
              label: emailTimer !== null ? formatTimer(emailTimer) : '인증하기',
              onPress: handleEmailVerify,
            }}
            validationState={emailValidation}
            validationMessage={getMessage('email', emailValidation)}
          />

          {emailSent &&
            (() => {
              const isExpired = emailTimer === null && codeValidation !== 'success';
              const codeMsg = isExpired
                ? getMessage('codeExpired', 'error')
                : getMessage('code', codeValidation);
              const codeState: ValidationState = isExpired ? 'error' : codeValidation;
              return (
                <FormField
                  label="인증번호"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  rightButton={{ label: '확인', onPress: handleCodeConfirm }}
                  validationState={codeState}
                  validationMessage={codeMsg}
                />
              );
            })()}

          <FormField
            label="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? 'eye-outline' : 'eye-off-outline'}
            onRightIconPress={() => setShowPassword((prev) => !prev)}
            bottomElement={<PasswordStrengthBar password={password} />}
          />

          <FormField
            label="비밀번호 확인"
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            secureTextEntry={!showPasswordConfirm}
            rightIcon={showPasswordConfirm ? 'eye-outline' : 'eye-off-outline'}
            onRightIconPress={() => setShowPasswordConfirm((prev) => !prev)}
            validationState={passwordConfirmValidation}
            validationMessage={getMessage(
              passwordConfirmValidation === 'success'
                ? 'passwordConfirmSuccess'
                : 'passwordConfirmError',
              passwordConfirmValidation
            )}
          />

          <TermsCheckbox
            checked={agreed}
            onChange={setAgreed}
            onTermsPress={() => {}}
            onPrivacyPress={() => {}}
          />
        </View>

        <PrimaryButton
          label="다음으로 →"
          onPress={() => router.push('/(auth)/register/child')}
          disabled={
            !name ||
            idValidation !== 'success' ||
            phoneValidation !== 'success' ||
            codeValidation !== 'success' ||
            getStrength(password) < 2 ||
            passwordConfirmValidation !== 'success' ||
            !agreed
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
