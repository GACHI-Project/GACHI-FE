import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { View, Text, Image, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AuthInput from '../../src/components/auth/AuthInput';
import { PrimaryButton } from '../../src/components/common/Button';
import ConfirmModal from '../../src/components/common/ConfirmModal';
import {
  login,
  AuthApiError,
  getKakaoAuthorizeUrl,
  completeGoogleLogin,
  saveAuthTokens,
} from '../../src/api/auth';
import {
  getSessionVersion,
  isCurrentSession,
  assertCurrentSession,
} from '../../src/utils/authSession';
import { attemptPendingLink } from '../../src/utils/pendingLink';
import { getMe } from '../../src/api/user';
import { useUserStore } from '../../src/store/userStore';
import { useRegisterStore } from '../../src/store/registerStore';
import { useKakaoAuthStore } from '../../src/store/kakaoAuthStore';
import { useGoogleAuthStore } from '../../src/store/googleAuthStore';
import { useSocialLinkStore } from '../../src/store/socialLinkStore';
import i18n, { saveLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '../../src/i18n';
import { fromServerLanguageCode } from '../../src/types/language';
import { registerDevicePushToken } from '../../src/utils/pushToken';
import { maskEmail } from '../../src/utils/mask';
import { KAKAO_REDIRECT_URI } from '../../src/constants/socialAuth';
import colors from '../../src/constants/colors';
import KakaoIcon from '../../assets/social/kakao.png';
import GoogleIcon from '../../assets/social/google.png';
import styles from '../../src/styles/auth/login';

const LoginScreen = () => {
  const { t } = useTranslation();
  const { kakaoError } = useLocalSearchParams<{ kakaoError?: string }>();
  const idInputRef = useRef<TextInput>(null);
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [linkHint, setLinkHint] = useState<string | undefined>();
  const [linkRequiredVisible, setLinkRequiredVisible] = useState(false);

  const isAnyLoginInProgress = loading || kakaoLoading || googleLoading;

  const setName = useUserStore((s) => s.setName);
  const pendingLink = useSocialLinkStore((s) => s.pendingLink);

  useEffect(() => {
    GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '' });
  }, []);

  useEffect(
    () => () => {
      // 로그인 화면을 벗어나면 보류 중인 계정 연결 요청은 폐기
      useSocialLinkStore.getState().clearPendingLink();
    },
    []
  );

  useEffect(() => {
    if (!kakaoError) return;
    if (kakaoError === 'linkRequired') {
      setLinkRequiredVisible(true);
      return;
    }
    if (kakaoError === 'network') {
      setErrorMessage(t('common.networkError'));
    } else {
      setErrorMessage(t(`auth.login.error.${kakaoError}`));
    }
  }, [kakaoError, t]);

  const completeNavigation = async (version: number) => {
    try {
      const me = await getMe();
      assertCurrentSession(version);
      setName(me.name);
      const lang = fromServerLanguageCode(me.languageCode) as SupportedLanguage;
      if (SUPPORTED_LANGUAGES.includes(lang)) {
        await saveLanguage(lang);
        assertCurrentSession(version);
        await i18n.changeLanguage(lang);
      }
    } catch {
      /* language sync failure should not block login */
    }

    assertCurrentSession(version);
    router.replace('/(tabs)');
    registerDevicePushToken().catch(() => {});
  };

  const handleLogin = async () => {
    const version = getSessionVersion();
    setLoading(true);
    setErrorMessage(undefined);
    try {
      const result = await login(id, password, stayLoggedIn);
      await saveAuthTokens(result, version);
      const pending = useSocialLinkStore.getState().pendingLink;
      if (pending) {
        await attemptPendingLink(pending, version);
        setLinkHint(undefined);
      }
      await completeNavigation(version);
    } catch (error) {
      if (!isCurrentSession(version)) return;
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
    if (useSocialLinkStore.getState().pendingLink?.provider === 'kakao') {
      useSocialLinkStore.getState().clearPendingLink();
    }
    setKakaoLoading(true);
    setErrorMessage(undefined);
    try {
      useKakaoAuthStore.getState().setMode('login');
      useKakaoAuthStore.getState().setRememberMe(stayLoggedIn);
      await WebBrowser.openAuthSessionAsync(getKakaoAuthorizeUrl(), KAKAO_REDIRECT_URI);
    } catch {
      setErrorMessage(t('common.networkError'));
    } finally {
      setKakaoLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (useSocialLinkStore.getState().pendingLink?.provider === 'google') {
      useSocialLinkStore.getState().clearPendingLink();
    }
    const version = getSessionVersion();
    setGoogleLoading(true);
    setErrorMessage(undefined);
    try {
      if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
        setErrorMessage(t('auth.login.error.generic'));
        return;
      }

      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      assertCurrentSession(version);
      if (response.type === 'cancelled') {
        return;
      }

      const { idToken } = response.data;
      if (!idToken) {
        setErrorMessage(t('auth.login.error.generic'));
        return;
      }

      const res = await completeGoogleLogin(idToken, stayLoggedIn);
      assertCurrentSession(version);

      if (res.status === 'LOGIN_SUCCESS' && res.tokens) {
        await saveAuthTokens(res.tokens, version);

        const pending = useSocialLinkStore.getState().pendingLink;
        if (pending && pending.provider !== 'google') {
          await attemptPendingLink(pending, version);
        }
        assertCurrentSession(version);

        await completeNavigation(version);
      } else if (res.signupToken) {
        useSocialLinkStore.getState().clearPendingLink();
        useGoogleAuthStore.getState().setRememberMe(stayLoggedIn);
        useRegisterStore.getState().reset();
        useRegisterStore.getState().setAuthMethod('google');
        useRegisterStore.getState().setSignupToken(res.signupToken);
        router.push('/(auth)/register/language');
      } else if (res.linkToken) {
        useSocialLinkStore.getState().setPendingLink({
          provider: 'google',
          linkToken: res.linkToken,
          rememberMe: stayLoggedIn,
          email: res.email,
        });
        setLinkRequiredVisible(true);
      } else {
        setErrorMessage(t('auth.login.error.generic'));
      }
    } catch (error) {
      if (!isCurrentSession(version)) return;
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
          ref={idInputRef}
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

        {linkHint && <Text style={styles.linkHintText}>{linkHint}</Text>}

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

      <ConfirmModal
        visible={linkRequiredVisible}
        onClose={() => setLinkRequiredVisible(false)}
        icon={<Ionicons name="link-outline" size={24} color={colors.primary[500]} />}
        title={t('auth.login.linkModal.title')}
        description={t('auth.login.linkModal.description', {
          email: pendingLink?.email ? maskEmail(pendingLink.email) : '',
          provider: pendingLink ? t(`profile.accountLink.${pendingLink.provider}`) : '',
        })}
        cancelText={t('auth.login.linkModal.cancel')}
        onCancel={() => {
          useSocialLinkStore.getState().clearPendingLink();
          setLinkRequiredVisible(false);
        }}
        confirmText={t('auth.login.linkModal.confirm')}
        onConfirm={() => {
          setLinkRequiredVisible(false);
          if (pendingLink) {
            setLinkHint(
              t('auth.login.linkModal.hint', {
                provider: t(`profile.accountLink.${pendingLink.provider}`),
              })
            );
          }
          idInputRef.current?.focus();
        }}
      />
    </ScrollView>
  );
};

export default LoginScreen;
