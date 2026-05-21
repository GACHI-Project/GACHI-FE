import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ko from './locales/ko.json';
import en from './locales/en.json';

export type SupportedLanguage = 'ko' | 'en';

const LANGUAGE_KEY = 'app_language';

const getInitialLanguage = async (): Promise<SupportedLanguage> => {
  // TODO: API 연동 후 로그인 시 서버에서 받은 언어로 교체
  const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (saved === 'ko' || saved === 'en') return saved;
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
