import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { registerPushToken } from '../api/notifications';

export const registerDevicePushToken = async (): Promise<void> => {
  if (!Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return;

  try {
    const platform = 'EXPO' as const;
    const appVersion = Constants.expoConfig?.version ?? '1.0.0';
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const deviceId =
      Platform.OS === 'android'
        ? (Application.getAndroidId() ?? 'android-unknown')
        : ((await Application.getIosIdForVendorAsync()) ?? 'ios-unknown');

    await registerPushToken({ platform, token, deviceId, appVersion });
  } catch {
    // push token registration failure is non-fatal
  }
};
