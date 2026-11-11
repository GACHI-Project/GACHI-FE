import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { completeKakaoLogin, AuthApiError, saveAuthTokens } from '../../src/api/auth';
import {
  getSessionVersion,
  isCurrentSession,
  assertCurrentSession,
} from '../../src/utils/authSession';
import { getMe } from '../../src/api/user';
import { useUserStore } from '../../src/store/userStore';
import { useRegisterStore } from '../../src/store/registerStore';
import { useKakaoAuthStore } from '../../src/store/kakaoAuthStore';
import i18n, { saveLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '../../src/i18n';
import { fromServerLanguageCode } from '../../src/types/language';
import { registerDevicePushToken } from '../../src/utils/pushToken';
import colors from '../../src/constants/colors';

type KakaoErrorCode =
  | 'invalidCredentials'
  | 'withdrawnAccount'
  | 'tooManyAttempts'
  | 'generic'
  | 'network';

const replaceToLoginWithError = (code: KakaoErrorCode) => {
  router.replace({ pathname: '/(auth)/login', params: { kakaoError: code } });
};

const KakaoAuthBounceScreen = () => {
  const { ticket } = useLocalSearchParams<{ ticket?: string }>();
  const setName = useUserStore((s) => s.setName);
  const setAuthMethod = useRegisterStore((s) => s.setAuthMethod);
  const setSignupToken = useRegisterStore((s) => s.setSignupToken);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    try {
      Promise.resolve(WebBrowser.dismissBrowser()).catch(() => {});
    } catch {
      /* 플랫폼에서 지원하지 않으면 무시 */
    }

    const complete = async () => {
      const version = getSessionVersion();
      if (!ticket) {
        replaceToLoginWithError('generic');
        return;
      }

      const { rememberMe } = useKakaoAuthStore.getState();

      try {
        const res = await completeKakaoLogin(ticket, rememberMe);
        assertCurrentSession(version);

        if (res.status === 'LOGIN_SUCCESS' && res.tokens) {
          await saveAuthTokens(res.tokens, version);

          try {
            const me = await getMe();
            assertCurrentSession(version);
            setName(me.name);
            const lang = fromServerLanguageCode(me.languageCode) as SupportedLanguage;
            if (SUPPORTED_LANGUAGES.includes(lang)) {
              await saveLanguage(lang);
              await i18n.changeLanguage(lang);
            }
          } catch {
            /* language sync failure should not block login */
          }

          assertCurrentSession(version);
          router.replace('/(tabs)');
          registerDevicePushToken().catch(() => {});
        } else if (res.signupToken) {
          useRegisterStore.getState().reset();
          setAuthMethod('kakao');
          setSignupToken(res.signupToken);
          router.replace('/(auth)/register/language');
        } else if (res.linkToken) {
          replaceToLoginWithError('generic');
        } else {
          replaceToLoginWithError('generic');
        }
      } catch (error) {
        if (!isCurrentSession(version)) return;
        if (error instanceof AuthApiError) {
          if (error.code === 'AUTH4011') {
            replaceToLoginWithError('invalidCredentials');
          } else if (error.code === 'AUTH4031') {
            replaceToLoginWithError('withdrawnAccount');
          } else if (error.code === 'AUTH4293') {
            replaceToLoginWithError('tooManyAttempts');
          } else {
            replaceToLoginWithError('generic');
          }
        } else {
          replaceToLoginWithError('network');
        }
      }
    };

    complete();
  }, [ticket, setName, setAuthMethod, setSignupToken]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary[400]} />
    </View>
  );
};

export default KakaoAuthBounceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text.white,
  },
});
