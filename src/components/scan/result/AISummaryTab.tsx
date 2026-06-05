import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import SummaryCard from './SummaryCard';
import {
  getNewsletterSummary,
  getConversationTopics,
  NewsletterApiError,
} from '../../../api/newsletter';
import type { NewsletterSummaryResult, ConversationTopic } from '../../../api/newsletter';
import colors from '../../../constants/colors';
import fonts from '../../../constants/fonts';

interface Props {
  newsletterId?: number;
}

const mapSummaryErrorKey = (e: unknown): string => {
  if (e instanceof NewsletterApiError) {
    if (e.code === 'NL4092') return 'scan.result.aiSummary.error.analyzing';
    if (e.code === 'NL4221') return 'scan.result.aiSummary.error.analysisFailed';
    if (e.code === 'NL4041') return 'scan.result.aiSummary.error.newsletterNotFound';
    if (e.code === 'NL4031') return 'scan.result.aiSummary.error.noAccess';
  }
  return 'scan.result.aiSummary.error.summaryFailed';
};

const AISummaryTab = ({ newsletterId }: Props) => {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<NewsletterSummaryResult | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [topics, setTopics] = useState<ConversationTopic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  useEffect(() => {
    setSummary(null);
    setSummaryLoading(true);
    setSummaryError(null);
    setTopics([]);
    setTopicsLoading(true);
    setTopicsError(null);

    if (!newsletterId) {
      setSummaryError('scan.result.aiSummary.error.notFound');
      setSummaryLoading(false);
      setTopicsError('scan.result.aiSummary.error.notFound');
      setTopicsLoading(false);
      return () => {};
    }

    let cancelled = false;

    getNewsletterSummary(newsletterId)
      .then((data) => {
        if (!cancelled) {
          setSummary(data);
          setSummaryError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setSummaryError(mapSummaryErrorKey(e));
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });

    getConversationTopics(newsletterId)
      .then((data) => {
        if (!cancelled) {
          setTopics(data);
          setTopicsError(null);
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof NewsletterApiError && e.code === 'NL4041') {
          setTopicsError('scan.result.aiSummary.error.newsletterNotFound');
        } else {
          setTopicsError('scan.result.aiSummary.error.conversationFailed');
        }
      })
      .finally(() => {
        if (!cancelled) setTopicsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [newsletterId]);

  const qnaItems = t('scan.result.aiSummary.qna', { returnObjects: true }) as Array<{
    q: string;
    a: string;
    aHighlight: string;
    aTail: string;
  }>;

  const renderSummary = () => {
    if (summaryLoading) return <ActivityIndicator size="small" color={colors.primary[400]} />;
    if (summaryError) return <Text style={styles.errorText}>{t(summaryError)}</Text>;
    if (summary)
      return (
        <>
          <Text style={styles.summaryTitle}>{summary.title}</Text>
          <Text style={styles.body}>{summary.summary}</Text>
        </>
      );
    return null;
  };

  const renderTopics = () => {
    if (topicsLoading) return <ActivityIndicator size="small" color={colors.primary[400]} />;
    if (topicsError) return <Text style={styles.errorText}>{t(topicsError)}</Text>;
    if (topics.length === 0)
      return <Text style={styles.errorText}>{t('scan.result.aiSummary.conversationEmpty')}</Text>;
    return (
      <View style={styles.topicList}>
        {topics.map((item) => (
          <View key={item.topicId} style={styles.topicBubble}>
            <Text style={styles.topicText}>{item.topic}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.list}>
      <SummaryCard
        icon="bulb-outline"
        iconBg={colors.primary[400]}
        title={t('scan.result.aiSummary.summarySection')}
      >
        {renderSummary()}
      </SummaryCard>

      <SummaryCard
        icon="chatbubbles-outline"
        iconBg={colors.secondary[500]}
        title={t('scan.result.aiSummary.conversationTitle')}
      >
        {renderTopics()}
      </SummaryCard>

      <SummaryCard
        icon="earth-outline"
        iconBg={colors.primary[400]}
        title={t('scan.result.aiSummary.culturalContext')}
      >
        <View style={styles.qnaList}>
          {qnaItems.map((item) => (
            <View key={item.q} style={styles.qnaItem}>
              <View style={styles.qnaRow}>
                <Text style={styles.qLabel}>Q.</Text>
                <Text style={styles.qText}>{item.q}</Text>
              </View>
              <View style={styles.qnaRow}>
                <Text style={styles.aLabel}>A.</Text>
                <Text style={styles.aText}>
                  {item.a}
                  <Text style={styles.aHighlight}>{item.aHighlight}</Text>
                  {item.aTail}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </SummaryCard>
    </View>
  );
};

export default AISummaryTab;

const styles = StyleSheet.create({
  list: {
    gap: 16,
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
  topicList: {
    gap: 10,
  },
  topicBubble: {
    backgroundColor: colors.secondary[200],
    borderWidth: 1,
    borderColor: colors.secondary[500],
    borderRadius: 16,
    borderBottomLeftRadius: 0,
    padding: 12,
  },
  topicText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.primary,
    lineHeight: 22,
  },
  qnaList: {
    gap: 16,
  },
  qnaItem: {
    gap: 6,
  },
  qnaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  qLabel: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.primary[500],
    width: 18,
  },
  aLabel: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text.secondary,
    width: 18,
  },
  qText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
    lineHeight: 22,
  },
  aText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  aHighlight: {
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
});
