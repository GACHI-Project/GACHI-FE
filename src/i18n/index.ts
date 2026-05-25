import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ko from './locales/ko.json';
import en from './locales/en.json';
import { LanguageType } from '../types/language';

export type SupportedLanguage = LanguageType;

const LANGUAGE_KEY = 'app_language';

// TODO: vi.json, zh.json 번역 파일 추가 후 VALID_LANGUAGES에 복구 예정
const VALID_LANGUAGES: LanguageType[] = ['ko', 'en'];

const getInitialLanguage = async (): Promise<SupportedLanguage> => {
  // TODO: API 연동 후 로그인 시 서버에서 받은 언어로 교체
  const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (saved && (VALID_LANGUAGES as string[]).includes(saved)) return saved as SupportedLanguage;
  return 'en';
};

export const saveLanguage = async (lang: SupportedLanguage) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
};

export const initI18n = async () => {
  const lng = await getInitialLanguage();

  await i18n.use(initReactI18next).init({
    lng,
    fallbackLng: 'ko',
    resources: {
      ko: { translation: ko },
      en: { translation: en },
    },
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });

  return i18n;
};

export default i18n;
