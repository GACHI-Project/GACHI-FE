import {
  getConversationTopics,
  getCulturalGuides,
  getNewsletterSummary,
  NewsletterApiError,
} from '../../api/newsletter';
import { useServerQuery } from '../../query/hooks';

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
  const summary = useServerQuery(
    'summary',
    [newsletterId],
    (signal) => getNewsletterSummary(newsletterId!, signal),
    { enabled: !!newsletterId }
  );
  const topics = useServerQuery(
    'topics',
    [newsletterId],
    (signal) => getConversationTopics(newsletterId!, signal),
    { enabled: !!newsletterId }
  );
  const guides = useServerQuery(
    'cultural',
    [newsletterId],
    (signal) => getCulturalGuides(newsletterId!, signal),
    { enabled: !!newsletterId }
  );
  const missing = 'scan.result.aiSummary.error.notFound';
  let summaryError: string | null = null;
  let topicsError: string | null = null;
  if (!newsletterId) {
    summaryError = missing;
    topicsError = missing;
  } else {
    if (summary.error) summaryError = mapSummaryErrorKey(summary.error);
    if (topics.error) topicsError = 'scan.result.aiSummary.error.conversationFailed';
  }
  return {
    summary: summary.data ?? null,
    summaryLoading: summary.isLoading,
    summaryError,
    topics: topics.data ?? [],
    topicsLoading: topics.isLoading,
    topicsError,
    guides: guides.data ?? [],
    guidesLoading: guides.isLoading,
  };
};

export default useAISummary;
