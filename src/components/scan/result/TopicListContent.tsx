import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ConversationTopic } from '../../../api/newsletter';
import colors from '../../../constants/colors';
import fonts from '../../../constants/fonts';

interface Props {
  loading: boolean;
  error: string | null;
  topics: ConversationTopic[];
}

const TopicListContent = ({ loading, error, topics }: Props) => {
  const { t } = useTranslation();
  if (loading) return <ActivityIndicator size="small" color={colors.primary[400]} />;
  if (error) return <Text style={styles.errorText}>{t(error)}</Text>;
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

export default TopicListContent;

const styles = StyleSheet.create({
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
  errorText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
});
