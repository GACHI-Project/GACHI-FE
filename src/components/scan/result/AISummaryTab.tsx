import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import SummaryCard from './SummaryCard';
import SummarySectionContent from './SummarySectionContent';
import TopicListContent from './TopicListContent';
import CulturalGuideList from './CulturalGuideList';
import useAISummary from '../../../hooks/scan/useAISummary';
import colors from '../../../constants/colors';

interface Props {
  newsletterId?: number;
}

const AISummaryTab = ({ newsletterId }: Props) => {
  const { t } = useTranslation();
  const {
    summary,
    summaryLoading,
    summaryError,
    topics,
    topicsLoading,
    topicsError,
    guides,
    guidesLoading,
  } = useAISummary(newsletterId);

  return (
    <View style={styles.list}>
      <SummaryCard
        icon="bulb-outline"
        iconBg={colors.primary[400]}
        title={t('scan.result.aiSummary.summarySection')}
      >
        <SummarySectionContent loading={summaryLoading} error={summaryError} summary={summary} />
      </SummaryCard>

      <SummaryCard
        icon="chatbubbles-outline"
        iconBg={colors.secondary[500]}
        title={t('scan.result.aiSummary.conversationTitle')}
      >
        <TopicListContent loading={topicsLoading} error={topicsError} topics={topics} />
      </SummaryCard>

      {(guidesLoading || guides.length > 0) && (
        <SummaryCard
          icon="earth-outline"
          iconBg={colors.primary[400]}
          title={t('scan.result.aiSummary.culturalContext')}
        >
          <CulturalGuideList loading={guidesLoading} guides={guides} />
        </SummaryCard>
      )}
    </View>
  );
};

export default AISummaryTab;

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
});
