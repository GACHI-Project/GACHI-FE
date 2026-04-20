import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import ConfettiCannon from 'react-native-confetti-cannon';
import { PrimaryButton } from '../../../src/components/common/Button';
import colors from '../../../src/constants/colors';
import fonts from '../../../src/constants/fonts';
import layout from '../../../src/constants/layout';
import { signup, login } from '../../../src/api/auth';
import { registerChild } from '../../../src/api/child';
import { useRegisterStore } from '../../../src/store/registerStore';

// ─── 메인 화면 ────────────────────────────────────────────────────────────────

type Status = 'loading' | 'done' | 'error';

const RegisterCompleteScreen = () => {
  const confettiRef = useRef<React.ComponentRef<typeof ConfettiCannon>>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const run = useCallback(async () => {
    const {
      loginId,
      password,
      name,
      email,
      phoneNumber,
      children,
      signupDone,
      loginDone,
      registeredChildrenCount,
      setSignupDone,
      setLoginDone,
      incrementRegisteredChildrenCount,
      reset,
    } = useRegisterStore.getState();

    setStatus('loading');
    setErrorMessage('');

    if (!loginId) {
      setStatus('error');
      setErrorMessage('회원가입 정보가 없어요. 처음부터 다시 시도해주세요.');
      return;
    }

    try {
      if (!signupDone) {
        await signup({
          name,
          email,
          loginId,
          password,
          passwordConfirm: password,
          phoneNumber,
          consentAgreed: true,
        });
        setSignupDone(true);
      }

      let accessToken: string;

      if (!loginDone) {
        const result = await login(loginId, password, false);
        await SecureStore.setItemAsync('accessToken', result.accessToken);
        await SecureStore.setItemAsync('refreshToken', result.refreshToken);
        setLoginDone(true);
        accessToken = result.accessToken;
      } else {
        const stored = await SecureStore.getItemAsync('accessToken');
        if (stored) {
          accessToken = stored;
        } else {
          const result = await login(loginId, password, false);
          await SecureStore.setItemAsync('accessToken', result.accessToken);
          await SecureStore.setItemAsync('refreshToken', result.refreshToken);
          accessToken = result.accessToken;
        }
      }

      await children.slice(registeredChildrenCount).reduce(async (prev, child) => {
        await prev;
        await registerChild(child, accessToken);
        incrementRegisteredChildrenCount();
      }, Promise.resolve());

      setStatus('done');
      reset();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '오류가 발생했어요. 다시 시도해주세요.'
      );
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  useEffect(() => {
    if (status === 'done' && confettiRef.current) {
      confettiRef.current.start();
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary[400]} />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={run} activeOpacity={0.7}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.outerCircleWrapper}>
          <Svg width={150} height={150} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="outerGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="30%" stopColor="#4DA3FF" stopOpacity="1" />
                <Stop offset="60%" stopColor="#5BAAFF" stopOpacity="0.65" />
                <Stop offset="80%" stopColor="#8AC8FF" stopOpacity="0.28" />
                <Stop offset="90%" stopColor="#B0D9FF" stopOpacity="0.08" />
                <Stop offset="100%" stopColor="#C1ECFC" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="75" cy="75" r="75" fill="url(#outerGrad)" />
          </Svg>
          <View style={styles.innerCircle}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        </View>

        {/* 텍스트 */}
        <View style={styles.textSection}>
          <Text style={styles.title}>가입이 완료됐어요!</Text>
          <Text style={styles.subtitle}>
            이제 가치와 함께 우리 아이의 학교 생활을 더 쉽게 알아가요
          </Text>
        </View>

        {/* 버튼 */}
        <View style={styles.buttonWrapper}>
          <PrimaryButton
            label="로그인하러 가기 →"
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
      </View>

      {/* 컨페티 */}
      <ConfettiCannon
        ref={confettiRef}
        count={150}
        origin={{ x: layout.screenPaddingHorizontal * 9, y: -10 }}
        colors={[
          colors.secondary[500],
          colors.primary[400],
          colors.secondary[600],
          colors.primary[300],
        ]}
        autoStart={false}
        explosionSpeed={800}
        fadeOut
      />
    </View>
  );
};

export default RegisterCompleteScreen;

// ─── 스타일 ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text.white,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  outerCircleWrapper: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 64,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
    lineHeight: 72,
  },
  textSection: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonWrapper: {
    alignSelf: 'stretch',
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  errorText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.red,
    textAlign: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary[400],
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
  },
});
