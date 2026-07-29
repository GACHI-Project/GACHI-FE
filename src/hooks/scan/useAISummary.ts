import { useEffect, useState } from 'react';
import {
  getNewsletterSummary,
  getConversationTopics,
  getCulturalGuides,
  NewsletterApiError,
} from '../../api/newsletter';
import type {
  NewsletterSummaryResult,
  ConversationTopic,
  CulturalGuide,
} from '../../api/newsletter';

const mapSummaryErrorKey = (e: unknown): string => {
  if (e instanceof NewsletterApiError) {
    if (e.code === 'NL4092') return 'scan.result.aiSummary.error.analyzing';
    if (e.code === 'NL4221') return 'scan.result.aiSummary.error.analysisFailed';
    if (e.code === 'NL4041') return 'scan.result.aiSummary.error.newsletterNotFound';
    if (e.code === 'NL4031') return 'scan.result.aiSummary.error.noAccess';
  }
  return 'scan.result.aiSummary.error.summaryFailed';
};

const useAISummary = (newsletterId: number | undefined) => {
  const [summary, setSummary] = useState<NewsletterSummaryResult | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [topics, setTopics] = useState<ConversationTopic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  const [guides, setGuides] = useState<CulturalGuide[]>([]);
  const [guidesLoading, setGuidesLoading] = useState(true);

  useEffect(() => {
    setSummary(null);
    setSummaryLoading(true);
    setSummaryError(null);
    setTopics([]);
    setTopicsLoading(true);
    setTopicsError(null);
    setGuides([]);
    setGuidesLoading(true);

    if (!newsletterId) {
      setSummaryError('scan.result.aiSummary.error.notFound');
      setSummaryLoading(false);
      setTopicsError('scan.result.aiSummary.error.notFound');
      setTopicsLoading(false);
      setGuidesLoading(false);
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

    getCulturalGuides(newsletterId)
      .then((data) => {
        if (!cancelled) setGuides(data);
      })
      .catch(() => {
        if (!cancelled) setGuides([]);
      })
      .finally(() => {
        if (!cancelled) setGuidesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [newsletterId]);

  return {
    summary,
    summaryLoading,
    summaryError,
    topics,
    topicsLoading,
    topicsError,
    guides,
    guidesLoading,
  };
};

export default useAISummary;
