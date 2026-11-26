import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import { useGoogleAuthStore } from '../store/googleAuthStore';
import { useKakaoAuthStore } from '../store/kakaoAuthStore';
import { useRegisterStore } from '../store/registerStore';
import { useSocialLinkStore } from '../store/socialLinkStore';
import { subscribeSessionCleanup } from './session';

let uninstall: (() => void) | null = null;

// Installed by the app entry point; HTTP and domain APIs have no navigation/store dependencies.
export const installSessionEffects = (
  onCleared: () => void = () => router.replace('/(auth)/login')
) => {
  if (uninstall) return uninstall;
  const storeSubscriptions = [
    useRegisterStore,
    useKakaoAuthStore,
    useGoogleAuthStore,
    useSocialLinkStore,
  ].map((store) =>
    subscribeSessionCleanup((phase, reason) => {
      if (phase !== 'invalidated') return;
      if (reason === 'token-storage-retry' && store === useRegisterStore) return;
      store.getState().reset();
    })
  );
  const unsubscribe = subscribeSessionCleanup((phase, reason) => {
    if (reason === 'token-storage-retry') return;
    if (phase === 'clearing-tokens') {
      void Promise.resolve()
        .then(() => GoogleSignin.signOut())
        .catch(() => {});
    } else if (phase === 'cleared') {
      onCleared();
    }
  });
  const dispose = () => {
    if (uninstall !== dispose) return;
    unsubscribe();
    storeSubscriptions.forEach((remove) => remove());
    uninstall = null;
  };
  uninstall = dispose;
  return dispose;
};
