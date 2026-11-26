import { router, useNavigationContainerRef } from 'expo-router';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { getSessionSnapshot, getSessionVersion, subscribeSession } from '../utils/authSession';
import { installSessionEffects } from './sessionEffects';

const useSessionEffects = (contentReady: boolean) => {
  const navigation = useNavigationContainerRef();
  const navigationReady = useSyncExternalStore(
    useCallback((notify) => navigation.addListener('ready', notify), [navigation]),
    useCallback(() => navigation.isReady(), [navigation]),
    () => false
  );
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, getSessionSnapshot);
  const [redirectVersion, setRedirectVersion] = useState<number | null>(null);

  useEffect(() => installSessionEffects(() => setRedirectVersion(getSessionVersion())), []);

  useEffect(() => {
    if (redirectVersion === null) return;
    const latest = getSessionSnapshot();
    if (redirectVersion !== latest.version || latest.authenticated) {
      setRedirectVersion(null);
      return;
    }
    // Font/i18n startup can leave the root layout without a navigator for a while.
    if (!contentReady || !navigationReady) return;
    router.replace('/(auth)/login');
    setRedirectVersion(null);
  }, [redirectVersion, session.version, session.authenticated, contentReady, navigationReady]);
};

export default useSessionEffects;
