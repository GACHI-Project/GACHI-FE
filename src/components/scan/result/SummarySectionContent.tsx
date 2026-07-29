import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NewsletterSummaryResult } from '../../../api/newsletter';
import colors from '../../../constants/colors';
import fonts from '../../../constants/fonts';

interface Props {
  loading: boolean;
  error: string | null;
  summary: NewsletterSummaryResult | null;
}

const SummarySectionContent = ({ loading, error, summary }: Props) => {
  const { t } = useTranslation();
  if (loading) return <ActivityIndicator size="small" color={colors.primary[400]} />;
  if (error) return <Text style={styles.errorText}>{t(error)}</Text>;
  if (summary)
    return (
      <View style={styles.container}>
        <Text style={styles.summaryTitle}>{summary.title}</Text>
        <Text style={styles.body}>{summary.summary}</Text>
      </View>
    );
  return null;
};

export default SummarySectionContent;

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  summaryTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  body: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.primary,
    lineHeight: 22,
  },
  errorText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
});
