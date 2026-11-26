import { requestLogout } from '../api/auth';
import { getSessionVersion, isCurrentSession } from '../utils/authSession';
import { clearSession, getStoredAuthTokens, type SessionCleanupResult } from './session';

export const logout = async (): Promise<SessionCleanupResult | undefined> => {
  const version = getSessionVersion();
  try {
    const { accessToken, refreshToken } = await getStoredAuthTokens(version);
    if (accessToken) {
      await requestLogout(accessToken, refreshToken, version);
    }
  } catch {
    // API 실패해도 로컬 토큰 삭제 후 로그인으로 이동
  }
  if (isCurrentSession(version)) return clearSession();
  return undefined;
};
