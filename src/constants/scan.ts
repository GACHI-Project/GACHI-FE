import { Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

export const SCAN_FRAME_W = SCREEN_W - 40;
export const SCAN_FRAME_H = SCAN_FRAME_W * 1.35;
export const SCAN_CORNER = 28;
export const SCAN_THICK = 4;
export const SCAN_DEFAULT_CHILD_COLOR = '#2CDA00';

export const MAX_PAGES = 10;

export interface CapturedPage {
  id: string;
  uri: string;
}

// 스캔 화면 간 전달하는 자녀 정보 라우트 파라미터 (expo-router 제약상 type으로 선언)
export type ScanChildParams = {
  childId: string;
  childName: string;
  childColor: string;
  childGrade: string;
};
