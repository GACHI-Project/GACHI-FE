import { ImageSourcePropType } from 'react-native';

export type LanguageType = 'ko' | 'en' | 'vi' | 'zh';

export interface LanguageOption {
  type: LanguageType;
  name: string;
  label: string;
  flag: ImageSourcePropType;
}
