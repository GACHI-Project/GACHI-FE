import { ImageSourcePropType } from 'react-native';

export type LanguageType = 'ko' | 'en' | 'vi' | 'zh';

export interface LanguageOption {
  type: LanguageType;
  name: string;
  label: string;
  flag: ImageSourcePropType;
}

const TO_SERVER: Record<LanguageType, string> = {
  ko: 'KO',
  en: 'US',
  vi: 'VI',
  zh: 'ZH',
};

const FROM_SERVER: Record<string, LanguageType> = {
  KO: 'ko',
  US: 'en',
  VI: 'vi',
  ZH: 'zh',
};

export const toServerLanguageCode = (lang: LanguageType): string => TO_SERVER[lang] ?? 'KO';
export const fromServerLanguageCode = (code: string): LanguageType => FROM_SERVER[code] ?? 'ko';
