import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import * as Notifications from 'expo-notifications';
import { initI18n } from '../src/i18n';
import { useNotificationStore } from '../src/store/notificationStore';
import { fetchUnreadCount } from '../src/api/notifications';

SplashScreen.preventAutoHideAsync().catch(() => {});

// eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
const FONTS = {
  'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.otf'),
  'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.otf'),
  'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
  'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
};

const RootLayout = () => {
  const [ready, setReady] = useState(false);
  const { setUnreadCount } = useNotificationStore();

  useEffect(() => {
    Promise.all([Font.loadAsync(FONTS), initI18n()]).finally(() => {
      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
    });
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      fetchUnreadCount()
        .then(setUnreadCount)
        .catch(() => {});
    });
    return () => subscription.remove();
  }, [setUnreadCount]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;

const styles = StyleSheet.create({
  root: { flex: 1 },
});
