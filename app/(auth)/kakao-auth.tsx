import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  AuthApiError,
  completeKakaoLogin as completeKakaoLoginApi,
  linkKakao as linkKakaoApi,
  saveAuthTokens,
  saveRememberMe,
} from '../../src/api/auth';
import { getMe as getMeApi } from '../../src/api/user';
import colors from '../../src/constants/colors';
import i18n, { saveLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '../../src/i18n';
import { useApiMutation } from '../../src/query/hooks';
import { fetchSessionResource } from '../../src/query/operations';
import { useKakaoAuthStore } from '../../src/store/kakaoAuthStore';
import { useRegisterStore } from '../../src/store/registerStore';
import { useSocialLinkStore } from '../../src/store/socialLinkStore';
import { fromServerLanguageCode } from '../../src/types/language';
import {
  assertCurrentSession,
  getSessionVersion,
  isCurrentSession,
} from '../../src/utils/authSession';
import { attemptPendingLink, mapLinkError } from '../../src/utils/pendingLink';
import { registerDevicePushToken } from '../../src/utils/pushToken';

type KakaoErrorCode =
  | 'invalidCredentials'
  | 'withdrawnAccount'
  | 'tooManyAttempts'
  | 'generic'
  | 'network'
  | 'linkRequired';

type KakaoLinkResult = 'success' | 'mismatch' | 'alreadyLinked' | 'error';

const replaceToLoginWithError = (code: KakaoErrorCode) => {
  router.replace({ pathname: '/(auth)/login', params: { kakaoError: code } });
};

const replaceToEditWithResult = (result: KakaoLinkResult) => {
  router.replace({ pathname: '/profile/edit', params: { kakaoLinkResult: result } });
};

let lastHandledTicket: string | null = null;

const KakaoAuthBounceScreen = () => {
  const linkKakao = useApiMutation(linkKakaoApi, []);
  const completeKakaoLogin = useApiMutation(completeKakaoLoginApi, []);
  const { ticket } = useLocalSearchParams<{ ticket?: string }>();
  const setAuthMethod = useRegisterStore((s) => s.setAuthMethod);
  const setSignupToken = useRegisterStore((s) => s.setSignupToken);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    if (ticket && ticket === lastHandledTicket) {
      return;
    }

    try {
      Promise.resolve(WebBrowser.dismissBrowser()).catch(() => {});
    } catch {
      /* 플랫폼에서 지원하지 않으면 무시 */
    }

    const completeLink = async (ticketValue: string, rememberMe: boolean, version: number) => {
      try {
        const res = await completeKakaoLogin(ticketValue, rememberMe);
        assertCurrentSession(version);

        if (res.linkToken) {
          try {
            const linked = await linkKakao(res.linkToken, rememberMe, version);
            assertCurrentSession(version);
            await saveAuthTokens(linked, version);
            replaceToEditWithResult('success');
          } catch (error) {
            if (!isCurrentSession(version)) return;
            replaceToEditWithResult(mapLinkError(error));
          }
        } else if (res.signupToken) {
          replaceToEditWithResult('mismatch');
        } else if (res.status === 'LOGIN_SUCCESS') {
          replaceToEditWithResult('alreadyLinked');
        } else {
          replaceToEditWithResult('error');
        }
      } catch {
        if (!isCurrentSession(version)) return;
        replaceToEditWithResult('error');
      }
    };

    const completeLogin = async (ticketValue: string, rememberMe: boolean, version: number) => {
      try {
        const res = await completeKakaoLogin(ticketValue, rememberMe);
        assertCurrentSession(version);

        if (res.status === 'LOGIN_SUCCESS' && res.tokens) {
          await saveAuthTokens(res.tokens, version);
          await saveRememberMe(rememberMe, version);

          const pending = useSocialLinkStore.getState().pendingLink;
          if (pending && pending.provider !== 'kakao') {
            await attemptPendingLink(pending, rememberMe, version);
          }
          assertCurrentSession(version);

          try {
            const me = await fetchSessionResource('profile', [], (signal) => getMeApi(signal));
            assertCurrentSession(version);

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
        } else if (res.signupToken) {
          useSocialLinkStore.getState().clearPendingLink();
          useRegisterStore.getState().reset();
          setAuthMethod('kakao');
          setSignupToken(res.signupToken);
          router.replace('/(auth)/register/language');
        } else if (res.linkToken) {
          useSocialLinkStore.getState().setPendingLink({
            provider: 'kakao',
            linkToken: res.linkToken,
            rememberMe,
            email: res.email,
          });
          replaceToLoginWithError('linkRequired');
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

    const { rememberMe, mode } = useKakaoAuthStore.getState();
    useKakaoAuthStore.getState().setMode('login');
    const version = getSessionVersion();

    if (!ticket) {
      if (mode === 'link') {
        replaceToEditWithResult('error');
      } else {
        replaceToLoginWithError('generic');
      }
      return;
    }

    lastHandledTicket = ticket;

    if (mode === 'link') {
      completeLink(ticket, rememberMe, version);
    } else {
      completeLogin(ticket, rememberMe, version);
    }
  }, [ticket, setAuthMethod, setSignupToken, completeKakaoLogin, linkKakao]);

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
