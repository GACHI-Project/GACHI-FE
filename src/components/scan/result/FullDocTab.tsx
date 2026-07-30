import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  getNewsletterTranslation,
  NewsletterTranslationResult,
  NewsletterApiError,
} from '../../../api/newsletter';
import CenteredMessage from '../../common/CenteredMessage';
import TextSection from './TextSection';

interface Props {
  newsletterId?: number;
}

const FullDocTab = ({ newsletterId }: Props) => {
  const { t } = useTranslation();
  const [data, setData] = useState<NewsletterTranslationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);

    if (!newsletterId) {
      setError(t('scan.result.fullDoc.error.notFound'));
      setLoading(false);
      return () => {};
    }

    let cancelled = false;

    getNewsletterTranslation(newsletterId)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof NewsletterApiError && e.code === 'NL4004') {
          setError(t('scan.result.fullDoc.error.notAnalyzed'));
        } else if (e instanceof NewsletterApiError && e.code === 'NL4041') {
          setError(t('scan.result.fullDoc.error.newsletterNotFound'));
        } else {
          setError(t('scan.result.fullDoc.error.loadFailed'));
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [newsletterId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <CenteredMessage loading />;
  if (error || !data)
    return <CenteredMessage message={error ?? t('scan.result.fullDoc.error.loadFailed')} />;

  const showTranslation = !!data.translatedText;

  return (
    <View style={styles.container}>
      {showTranslation && (
        <TextSection label={t('scan.result.fullDoc.translated')} text={data.translatedText!} />
      )}
      <TextSection
        label={
          showTranslation ? t('scan.result.fullDoc.ocrOriginal') : t('scan.result.fullDoc.original')
        }
        text={data.originalText}
      />
    </View>
  );
};

export default FullDocTab;

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
});
