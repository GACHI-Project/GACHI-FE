import { Alert } from 'react-native';
import { AuthApiError, linkGoogle, linkKakao, saveAuthTokens } from '../api/auth';
import i18n from '../i18n';
import { invalidateResources } from '../query/client';
import { executeSessionMutation } from '../query/operations';
import { useSocialLinkStore, type PendingLink } from '../store/socialLinkStore';
import { assertCurrentSession, isCurrentSession } from './authSession';

export type LinkErrorResult = 'mismatch' | 'alreadyLinked' | 'error';

export const mapLinkError = (error: unknown): LinkErrorResult => {
  if (error instanceof AuthApiError && error.status === 403) return 'mismatch';
  if (error instanceof AuthApiError && error.status === 409) return 'alreadyLinked';
  return 'error';
};

const LINK_ERROR_MESSAGE_KEYS: Record<LinkErrorResult, string> = {
  mismatch: 'auth.login.linkModal.resultMismatch',
  alreadyLinked: 'auth.login.linkModal.resultAlready',
  error: 'auth.login.linkModal.resultGeneric',
};

export const attemptPendingLink = async (
  pending: PendingLink,
  rememberMe: boolean,
  version: number
): Promise<void> => {
  try {
    assertCurrentSession(version);
    const linked = await executeSessionMutation(() =>
      pending.provider === 'kakao'
        ? linkKakao(pending.linkToken, rememberMe, version)
        : linkGoogle(pending.linkToken, rememberMe, version)
    );
    assertCurrentSession(version);
    await saveAuthTokens(linked, version);
    await invalidateResources(['profile'], version);
  } catch (error) {
    if (!isCurrentSession(version)) return;
    const messageKey = LINK_ERROR_MESSAGE_KEYS[mapLinkError(error)];
    Alert.alert(i18n.t('profile.accountLink.sectionTitle'), i18n.t(messageKey));
  } finally {
    if (isCurrentSession(version) && useSocialLinkStore.getState().pendingLink === pending)
      useSocialLinkStore.getState().clearPendingLink();
  }
};
