import { useState, useEffect } from 'react';
import axios from 'axios';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useTranslation } from 'react-i18next';
import AuthInput from '../../src/components/auth/AuthInput';
import { PrimaryButton } from '../../src/components/common/Button';
import {
  login,
  AuthApiError,
  getKakaoAuthorizeUrl,
  completeGoogleLogin,
  LoginResult,
} from '../../src/api/auth';
import { getMe } from '../../src/api/user';
import { useUserStore } from '../../src/store/userStore';
import { useRegisterStore } from '../../src/store/registerStore';
import { useKakaoAuthStore } from '../../src/store/kakaoAuthStore';
import { useGoogleAuthStore } from '../../src/store/googleAuthStore';
import i18n, { saveLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '../../src/i18n';
import { fromServerLanguageCode } from '../../src/types/language';
import { registerDevicePushToken } from '../../src/utils/pushToken';
import colors from '../../src/constants/colors';
import KakaoIcon from '../../assets/social/kakao.png';
import GoogleIcon from '../../assets/social/google.png';
import styles from '../../src/styles/auth/login';

const KAKAO_REDIRECT_URI = 'gachi://kakao-auth';

const LoginScreen = () => {
  const { t } = useTranslation();
  const { kakaoError } = useLocalSearchParams<{ kakaoError?: string }>();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const isAnyLoginInProgress = loading || kakaoLoading || googleLoading;

  const setName = useUserStore((s) => s.setName);

  useEffect(() => {
    GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '' });
  }, []);

  useEffect(() => {
    if (!kakaoError) return;
    if (kakaoError === 'network') {
      setErrorMessage(t('common.networkError'));
    } else {
      setErrorMessage(t(`auth.login.error.${kakaoError}`));
    }
  }, [kakaoError, t]);

  const finishLogin = async (tokens: LoginResult) => {
    await SecureStore.setItemAsync('accessToken', tokens.accessToken);
    await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);

    try {
      const me = await getMe();
      setName(me.name);
      const lang = fromServerLanguageCode(me.languageCode) as SupportedLanguage;
      if (SUPPORTED_LANGUAGES.includes(lang)) {
        await saveLanguage(lang);
        await i18n.changeLanguage(lang);
      }
    } catch {
      /* language sync failure should not block login */
    }

    router.replace('/(tabs)');
    registerDevicePushToken().catch(() => {});
  };

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage(undefined);
    try {
      const result = await login(id, password, stayLoggedIn);
      await finishLogin(result);
    } catch (error) {
      if (error instanceof AuthApiError) {
        if (error.code === 'AUTH4011') {
          setErrorMessage(t('auth.login.error.invalidCredentials'));
        } else if (error.code === 'AUTH4031') {
          setErrorMessage(t('auth.login.error.withdrawnAccount'));
        } else if (error.code === 'AUTH4293') {
          setErrorMessage(t('auth.login.error.tooManyAttempts'));
        } else {
          setErrorMessage(t('auth.login.error.generic'));
        }
      } else {
        setErrorMessage(t('common.networkError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    setKakaoLoading(true);
    setErrorMessage(undefined);
    try {
      useKakaoAuthStore.getState().setRememberMe(stayLoggedIn);
      await WebBrowser.openAuthSessionAsync(getKakaoAuthorizeUrl(), KAKAO_REDIRECT_URI);
    } catch {
      setErrorMessage(t('common.networkError'));
    } finally {
      setKakaoLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErrorMessage(undefined);
    try {
      if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
        setErrorMessage(t('auth.login.error.generic'));
        return;
      }

      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (response.type === 'cancelled') {
        return;
      }

      const { idToken } = response.data;
      if (!idToken) {
        setErrorMessage(t('auth.login.error.generic'));
        return;
      }

      const res = await completeGoogleLogin(idToken, stayLoggedIn);

      if (res.status === 'LOGIN_SUCCESS' && res.tokens) {
        await finishLogin(res.tokens);
      } else if (res.signupToken) {
        useGoogleAuthStore.getState().setRememberMe(stayLoggedIn);
        useRegisterStore.getState().reset();
        useRegisterStore.getState().setAuthMethod('google');
        useRegisterStore.getState().setSignupToken(res.signupToken);
        router.push('/(auth)/register/language');
      } else if (res.linkToken) {
        // TODO: 계정 연동(linkToken) 플로우는 별도 작업에서 구현 예정
        setErrorMessage(t('auth.login.error.generic'));
      } else {
        setErrorMessage(t('auth.login.error.generic'));
      }
    } catch (error) {
      if (error instanceof AuthApiError) {
        if (error.code === 'AUTH4011') {
          setErrorMessage(t('auth.login.error.invalidCredentials'));
        } else if (error.code === 'AUTH4031') {
          setErrorMessage(t('auth.login.error.withdrawnAccount'));
        } else if (error.code === 'AUTH4293') {
          setErrorMessage(t('auth.login.error.tooManyAttempts'));
        } else {
          setErrorMessage(t('auth.login.error.generic'));
        }
      } else if (axios.isAxiosError(error)) {
        setErrorMessage(t('common.networkError'));
      } else if (isErrorWithCode(error)) {
        if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
          setErrorMessage(t('auth.login.error.generic'));
        }
      } else {
        setErrorMessage(t('common.networkError'));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <LinearGradient colors={[colors.primary[300], colors.primary[100]]} style={styles.gradient} />
      <View style={styles.container}>
        <Text style={styles.title}>{t('auth.login.title')}</Text>

        <AuthInput
          label="ID"
          value={id}
          onChangeText={setId}
          iconName="person-outline"
          onClear={() => setId('')}
        />

        <AuthInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          iconName="lock-closed-outline"
          secureTextEntry={!showPassword}
          onToggleSecure={() => setShowPassword((prev) => !prev)}
        />

        <View style={styles.stayLoggedInRow}>
          <TouchableOpacity
            style={[styles.checkbox, stayLoggedIn && styles.checkboxChecked]}
            onPress={() => setStayLoggedIn((prev) => !prev)}
          >
            {stayLoggedIn && (
              <Text style={styles.checkboxMark} allowFontScaling={false}>
                ✓
              </Text>
            )}
          </TouchableOpacity>
          <Text style={styles.stayLoggedInText}>{t('auth.login.stayLoggedIn')}</Text>
        </View>

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <PrimaryButton
          label={loading ? t('auth.login.loading') : t('auth.login.button')}
          onPress={handleLogin}
          disabled={!id || !password || isAnyLoginInProgress}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('auth.login.socialDivider')}</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleKakaoLogin}
            disabled={isAnyLoginInProgress}
            activeOpacity={0.8}
          >
            <Image source={KakaoIcon} style={styles.socialIcon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleGoogleLogin}
            disabled={isAnyLoginInProgress}
            activeOpacity={0.8}
          >
            <Image source={GoogleIcon} style={styles.socialIcon} />
          </TouchableOpacity>
        </View>

        <Text style={styles.forgotRow}>
          <Text style={styles.forgotText} onPress={() => router.push('/(auth)/find-id')}>
            {t('auth.login.forgotId')}
          </Text>
          {'  |  '}
          <Text style={styles.forgotText} onPress={() => router.push('/(auth)/find-password')}>
            {t('auth.login.forgotPassword')}
          </Text>
        </Text>

        <TouchableOpacity
          onPress={() => {
            useRegisterStore.getState().reset();
            router.push('/(auth)/register/language');
          }}
        >
          <Text style={styles.signUpText}>
            {t('auth.login.noAccount')}
            {'  '}
            <Text style={styles.signUpLink}>{t('auth.login.signUp')}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default LoginScreen;
