import axios, { type AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ApiError } from '../api/errors';
import { API_BASE_URL, API_TIMEOUT_MS } from '../config/api';
import {
  assertCurrentSession,
  assertSessionAuthenticated,
  getSessionVersion,
  invalidateSession,
  isCurrentSession,
  markSessionAuthenticated,
} from '../utils/authSession';

export type SessionRequestConfig = AxiosRequestConfig & { sessionVersion: number };
export type SessionCleanupPhase = 'invalidated' | 'clearing-tokens' | 'cleared';
export type SessionCleanupReason = 'session-ended' | 'token-storage-retry';
const cleanupListeners = new Set<
  (phase: SessionCleanupPhase, reason: SessionCleanupReason) => void
>();

export const subscribeSessionCleanup = (
  listener: (phase: SessionCleanupPhase, reason: SessionCleanupReason) => void
) => {
  cleanupListeners.add(listener);
  return () => {
    cleanupListeners.delete(listener);
  };
};

const publishCleanup = (phase: SessionCleanupPhase) => {
  cleanupListeners.forEach((listener) => {
    try {
      listener(phase, cleanupReason);
    } catch {
      /* App effects cannot prevent credential cleanup. */
    }
  });
};

type AuthTokenKey = 'accessToken' | 'refreshToken';
export interface SessionCleanupResult {
  success: boolean;
  failedTokenKeys: AuthTokenKey[];
}
const AUTH_TOKEN_KEYS: AuthTokenKey[] = ['accessToken', 'refreshToken'];

// Capture the session before token lookup, and carry it through dispatch/retries.
export const getAuthRequestConfig = async (
  createUnauthorizedError: () => Error,
  version = getSessionVersion()
): Promise<SessionRequestConfig> => {
  assertSessionAuthenticated(version);
  const token = await getAccessToken(version);
  assertSessionAuthenticated(version);
  if (!token) throw createUnauthorizedError();
  return { headers: { Authorization: `Bearer ${token}` }, sessionVersion: version };
};

let refreshTask: {
  version: number;
  controller: AbortController;
  promise: Promise<string>;
} | null = null;
let clearingSession: Promise<SessionCleanupResult> | null = null;
let cleanupReason: SessionCleanupReason = 'session-ended';
let tokenCleanupStarted = false;
let tokenWrite: Promise<void> = Promise.resolve();
let tokenRevision = 0;

export class TokenStorageRetryError extends Error {
  constructor(
    message: string,
    public readonly sessionVersion: number
  ) {
    super(message);
    this.name = 'TokenStorageRetryError';
  }
}

const REMEMBER_ME_KEY = 'rememberMe';

export const saveRememberMe = (rememberMe: boolean, version: number): Promise<void> => {
  const write = tokenWrite.then(async () => {
    assertCurrentSession(version);
    if (clearingSession) throw new axios.CanceledError('Session is being cleared');
    await SecureStore.setItemAsync(REMEMBER_ME_KEY, rememberMe ? 'true' : 'false');
    assertCurrentSession(version);
  });
  tokenWrite = write.catch(() => {});
  return write;
};

export const getRememberMe = async (version = getSessionVersion()): Promise<boolean> => {
  assertCurrentSession(version);
  const value = await SecureStore.getItemAsync(REMEMBER_ME_KEY);
  assertCurrentSession(version);
  return value === 'true';
};

export const saveAuthTokens = (
  tokens: { accessToken: string; refreshToken: string },
  version: number,
  options: { allowRetry?: boolean } = {}
): Promise<void> => {
  const write = tokenWrite.then(async () => {
    assertCurrentSession(version);
    if (clearingSession) throw new axios.CanceledError('Session is being cleared');
    await SecureStore.setItemAsync('accessToken', tokens.accessToken);
    assertCurrentSession(version);
    await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
    markSessionAuthenticated(version);
    tokenRevision += 1;
  });
  tokenWrite = write.catch(() => {});
  return write.catch(async (error: unknown) => {
    // SecureStore has no multi-key transaction; a partial failure cannot keep a mixed token pair.
    // Reconcile after the queued write settles so cleanup never waits on itself.
    if (isCurrentSession(version) && !axios.isCancel(error)) {
      const cleanup = clearSession(options.allowRetry ? 'token-storage-retry' : 'session-ended');
      const retryVersion = getSessionVersion();
      await cleanup;
      if (options.allowRetry) {
        assertCurrentSession(retryVersion);
        if (cleanupReason !== 'token-storage-retry') throw new axios.CanceledError('Session ended');
        throw new TokenStorageRetryError(
          error instanceof Error ? error.message : String(error),
          retryVersion
        );
      }
    }
    throw error;
  });
};

export const refreshAccessToken = (version: number): Promise<string> => {
  try {
    assertSessionAuthenticated(version);
  } catch (error) {
    return Promise.reject(error);
  }
  if (refreshTask?.version === version) return refreshTask.promise;

  const controller = new AbortController();
  const promise = (async () => {
    try {
      const storedRefresh = await SecureStore.getItemAsync('refreshToken');
      assertSessionAuthenticated(version);
      if (!storedRefresh) throw new ApiError('UNAUTHORIZED', '로그인이 필요합니다.');

      const { data } = await axios.post(
        `${API_BASE_URL}/api/v1/auth/reissue`,
        { refreshToken: storedRefresh },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: API_TIMEOUT_MS,
          signal: controller.signal,
        }
      );
      await saveAuthTokens(data.result, version);
      return data.result.accessToken;
    } catch (error) {
      // 이전 세션의 늦은 실패로 새 세션을 종료하지 않는다.
      if (isCurrentSession(version)) await clearSession();
      throw error;
    } finally {
      if (refreshTask?.controller === controller) refreshTask = null;
    }
  })();
  refreshTask = { version, controller, promise };
  return promise;
};

export const getRetryAccessToken = async (
  version: number,
  rejectedAuthorization: string
): Promise<string> => {
  assertSessionAuthenticated(version);
  if (refreshTask?.version === version) return refreshTask.promise;
  const readRevision = tokenRevision;
  let currentToken: string | null;
  try {
    currentToken = await getAccessToken(version);
  } catch (error) {
    assertSessionAuthenticated(version);
    if (axios.isCancel(error)) throw error;
    if (readRevision !== tokenRevision) return getRetryAccessToken(version, rejectedAuthorization);
    return refreshAccessToken(version);
  }
  assertSessionAuthenticated(version);
  // Only an actual rotation is shared. A lookup cannot suppress a needed rotation.
  if (refreshTask?.version === version) return refreshTask.promise;
  // A storage read can finish after newer credentials were fully saved.
  if (readRevision !== tokenRevision) return getRetryAccessToken(version, rejectedAuthorization);
  if (currentToken && rejectedAuthorization !== `Bearer ${currentToken}`) return currentToken;
  return refreshAccessToken(version);
};

export const clearSession = (
  reason: SessionCleanupReason = 'session-ended'
): Promise<SessionCleanupResult> => {
  if (clearingSession) {
    // An explicit logout must still reset app state while a recoverable cleanup is pending.
    if (reason === 'session-ended' && cleanupReason === 'token-storage-retry') {
      cleanupReason = reason;
      invalidateSession();
      publishCleanup('invalidated');
      if (tokenCleanupStarted) publishCleanup('clearing-tokens');
    }
    return clearingSession;
  }

  cleanupReason = reason;
  clearingSession = tokenWrite
    .then(async () => {
      tokenCleanupStarted = true;
      publishCleanup('clearing-tokens');
      // 진행 중이던 토큰 저장이 끝난 뒤 삭제해 이전 토큰이 다시 남지 않게 한다.
      const results = await Promise.allSettled(
        AUTH_TOKEN_KEYS.map(async (key) => SecureStore.deleteItemAsync(key))
      );
      const failedKeys = AUTH_TOKEN_KEYS.filter((_, index) => results[index].status === 'rejected');
      const retries = await Promise.allSettled(
        failedKeys.map(async (key) => SecureStore.deleteItemAsync(key))
      );
      const failedTokenKeys = failedKeys.filter((_, index) => retries[index].status === 'rejected');
      await SecureStore.deleteItemAsync(REMEMBER_ME_KEY).catch(() => {});
      publishCleanup('cleared');
      return { success: failedTokenKeys.length === 0, failedTokenKeys };
    })
    .finally(() => {
      clearingSession = null;
      tokenCleanupStarted = false;
    });
  // Reserve cleanup before notifying app callbacks, which can reenter session APIs.
  invalidateSession();
  refreshTask?.controller.abort();
  refreshTask = null;
  publishCleanup('invalidated');
  return clearingSession;
};

export const isSessionClearing = () => clearingSession !== null;

export const getAccessToken = async (version = getSessionVersion()) => {
  assertCurrentSession(version);
  const token = await SecureStore.getItemAsync('accessToken');
  assertCurrentSession(version);
  return token;
};

export const getStoredAuthTokens = async (version = getSessionVersion()) => {
  const accessToken = await getAccessToken(version);
  const refreshToken = await SecureStore.getItemAsync('refreshToken');
  assertCurrentSession(version);
  return { accessToken, refreshToken };
};
