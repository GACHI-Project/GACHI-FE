import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
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
  const [data, setData] = useState<NewsletterTranslationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);

    if (!newsletterId) {
      setError('가정통신문 정보를 찾을 수 없어요.');
      setLoading(false);
      return;
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
          setError('아직 분석이 완료되지 않은 가정통신문이에요.');
        } else if (e instanceof NewsletterApiError && e.code === 'NL4041') {
          setError('가정통신문을 찾을 수 없어요.');
        } else {
          setError('문서를 불러오는 데 실패했어요.');
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [newsletterId]);

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
        <Text style={styles.errorText}>{error ?? '문서를 불러오는 데 실패했어요.'}</Text>
      </View>
    );
  }

  const showTranslation = !!data.translatedText;

  return (
    <View style={styles.container}>
      {showTranslation && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>번역된 문서</Text>
          <View style={styles.card}>
            <Text style={styles.bodyText}>{data.translatedText}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{showTranslation ? 'OCR 원문' : '원문'}</Text>
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
