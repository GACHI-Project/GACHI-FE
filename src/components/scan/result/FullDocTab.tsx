import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  getNewsletterTranslation,
  NewsletterTranslationResult,
  NewsletterApiError,
} from '../../../api/newsletter';
import colors from '../../../constants/colors';
import fonts from '../../../constants/fonts';

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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary[400]} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? t('scan.result.fullDoc.error.loadFailed')}</Text>
      </View>
    );
  }

  const showTranslation = !!data.translatedText;

  return (
    <View style={styles.container}>
      {showTranslation && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('scan.result.fullDoc.translated')}</Text>
          <View style={styles.card}>
            <Text style={styles.bodyText}>{data.translatedText}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{showTranslation ? t('scan.result.fullDoc.ocrOriginal') : t('scan.result.fullDoc.original')}</Text>
        <View style={styles.card}>
          <Text style={styles.bodyText}>{data.originalText}</Text>
        </View>
      </View>
    </View>
  );
};

export default FullDocTab;

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  section: {
    gap: 10,
  },
  centered: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  card: {
    borderRadius: 16,
    backgroundColor: colors.text.white,
    padding: 16,
    shadowColor: colors.gray[300],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  bodyText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.primary,
    lineHeight: 22,
  },
});
