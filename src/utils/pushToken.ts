import { Platform } from 'react-native';
// import * as Notifications from 'expo-notifications'; // SDK 53 Expo Go 호환성 문제로 임시 주석
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { registerPushToken } from '../api/notifications';

export const registerDevicePushToken = async (): Promise<void> => {
  const platform = Platform.OS === 'ios' ? 'IOS' : ('ANDROID' as const);
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  try {
    // 1. SDK 53 안드로이드 대응: Notifications 라이브러리 사용을 원천 차단하고 가짜 데이터 생성
    // 실제 배포 시에는 '개발 빌드'를 생성하고 주석을 해제해야 합니다.
    const token = 'ExponentPushToken[DUMMY_SDK53_TEST_TOKEN]';

    const deviceId =
      Platform.OS === 'android'
        ? (Application.getAndroidId() ?? 'android-test-id')
        : ((await Application.getIosIdForVendorAsync()) ?? 'ios-test-id');

    // 2. 백엔드 전송 테스트 (에뮬레이터/실기기 공통)
    await registerPushToken({
      platform,
      token,
      deviceId,
      appVersion,
    });

    console.log('[PushToken] 가짜 토큰으로 서버 등록 시도 성공:', token);
  } catch (error) {
    console.error('[PushToken] 등록 중 에러 발생:', error);
  }
};
