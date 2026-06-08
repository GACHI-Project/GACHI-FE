import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ko from './locales/ko.json';
import en from './locales/en.json';
import vi from './locales/vi.json';
import { LanguageType } from '../types/language';

export type SupportedLanguage = LanguageType;

const LANGUAGE_KEY = 'app_language';

export const SUPPORTED_LANGUAGES: LanguageType[] = ['ko', 'en', 'vi', 'zh'];

const getInitialLanguage = async (): Promise<SupportedLanguage> => {
  const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (saved && (SUPPORTED_LANGUAGES as string[]).includes(saved)) return saved as SupportedLanguage;
  return 'ko';
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
      vi: { translation: vi },
    },
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });

  return i18n;
};

export default i18n;
