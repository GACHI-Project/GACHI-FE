import { Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

export const SCAN_FRAME_W = SCREEN_W - 40;
export const SCAN_FRAME_H = SCAN_FRAME_W * 1.35;
export const SCAN_CORNER = 28;
export const SCAN_THICK = 4;
export const SCAN_DEFAULT_CHILD_COLOR = '#2CDA00';
