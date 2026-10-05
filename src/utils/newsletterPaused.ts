import { NewsletterStatusResult } from '../api/newsletter';

type TFunc = (key: string, options?: Record<string, unknown>) => string;

export const getPausedTitle = (info: NewsletterStatusResult, t: TFunc): string => {
  const page = info.pausedPageNo ?? 1;

  if (info.retryable === false && (info.retryCount ?? 0) >= 1) {
    return t('scan.loading.paused.titleRetryFailed', { page });
  }
  if (info.pausedReason === 'OCR_FAILED') {
    return t('scan.loading.paused.titleOcrFailed', { page });
  }
  if (info.pausedReason === 'UNREADABLE') {
    return t('scan.loading.paused.titleUnreadable', { page });
  }
  if (info.pausedReason === 'TRANSLATION_FAILED') {
    return t('scan.loading.paused.titleTranslationFailed', { page });
  }
  return t('scan.loading.paused.titleGeneric', { page });
};

export const getPausedDescription = (info: NewsletterStatusResult, t: TFunc): string => {
  const isTranslationFailed = info.pausedReason === 'TRANSLATION_FAILED';

  if (info.retryable && info.skippable) {
    return isTranslationFailed
      ? t('scan.loading.paused.descRetrySkipTranslation')
      : t('scan.loading.paused.descRetrySkipGeneric');
  }
  if (info.skippable) {
    return isTranslationFailed
      ? t('scan.loading.paused.descSkipOnlyTranslation')
      : t('scan.loading.paused.descSkipOnlyGeneric');
  }
  if (info.retryable) {
    return t('scan.loading.paused.descRetryOnly');
  }
  return t('scan.loading.paused.descGenericFallback');
};
