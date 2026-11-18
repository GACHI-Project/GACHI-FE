import { TranslationPage } from '../api/newsletter';

export const getPageTranslationText = (page: TranslationPage): string =>
  page.translatedText?.trim() ||
  [...(page.blocks ?? [])]
    .sort((a, b) => a.blockNo - b.blockNo)
    .map((block) => block.translatedText?.trim())
    .filter(Boolean)
    .join('\n\n');

export type PageView = 'translated' | 'originalOnly' | 'translationFailed' | 'recognitionFailed';

export const getPageView = (page: TranslationPage, isKoreanUser: boolean): PageView => {
  if (page.status === 'SUCCESS' && page.translatedText) return 'translated';
  if (!page.originalText) return 'recognitionFailed';
  return isKoreanUser ? 'originalOnly' : 'translationFailed';
};
