import { TranslationPage } from '../api/newsletter';

export type PageView = 'translated' | 'originalOnly' | 'translationFailed' | 'recognitionFailed';

export const getPageView = (page: TranslationPage, isKoreanUser: boolean): PageView => {
  if (page.status === 'SUCCESS' && page.translatedText) return 'translated';
  if (!page.originalText) return 'recognitionFailed';
  return isKoreanUser ? 'originalOnly' : 'translationFailed';
};
