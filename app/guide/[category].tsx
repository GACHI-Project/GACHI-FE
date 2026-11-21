import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSchoolGuideFaqs, type SchoolGuideCategoryEnum } from '../../src/api/schoolGuide';
import Header from '../../src/components/common/Header';
import QueryNotice from '../../src/components/common/QueryNotice';
import colors from '../../src/constants/colors';
import layout from '../../src/constants/layout';
import useGuideFaqExpand from '../../src/hooks/guide/useGuideFaqExpand';
import { useServerQuery } from '../../src/query/hooks';
import { hasBlockingQueryError } from '../../src/query/state';
import styles from '../../src/styles/guide/categoryScreen';

const CategoryScreen = () => {
  const { category, categoryEnum, emoji } = useLocalSearchParams<{
    category: string;
    categoryEnum: string;
    emoji: string;
  }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const query = useServerQuery(
    'guide',
    ['category', categoryEnum],
    (signal) => getSchoolGuideFaqs({ category: categoryEnum as SchoolGuideCategoryEnum }, signal),
    { enabled: !!categoryEnum }
  );
  const faqs = query.data ?? [];
  const loading = query.isLoading;
  const error = !categoryEnum || hasBlockingQueryError(query);
  const { expandedId, answerCache, loadingDetailId, handleExpand } = useGuideFaqExpand();

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[400]} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centered}>
          <QueryNotice
            message={t('guide.loadFailed')}
            onRetry={() => {
              void query.refetch();
            }}
            retrying={query.isFetching}
          />
        </View>
      );
    }
    return (
      <>
        {query.error && (
          <QueryNotice
            message={t('common.refreshFailed')}
            onRetry={() => {
              void query.refetch();
            }}
            retrying={query.isFetching}
          />
        )}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {(() => {
              const parts = t('guide.totalCount', { count: faqs.length }).split(
                String(faqs.length)
              );
              return (
                <>
                  <Text key="prefix">{parts[0]}</Text>
                  <Text key="count">
                    <Text style={styles.countBold}>{faqs.length}</Text>
                    {parts[1]}
                  </Text>
                </>
              );
            })()}
          </Text>
        </View>

        <FlatList
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + layout.screenPaddingBottom },
          ]}
          data={faqs}
          keyExtractor={(item) => String(item.faqId)}
          extraData={{ expandedId, answerCache, loadingDetailId }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const expanded = expandedId === item.faqId;
            const answer = answerCache[item.faqId];
            const detailLoading = loadingDetailId === item.faqId;

            let answerContent = null;
            if (expanded) {
              if (detailLoading) {
                answerContent = (
                  <ActivityIndicator color={colors.primary[400]} style={styles.detailSpinner} />
                );
              } else if (answer !== undefined) {
                answerContent = <Text style={styles.qaAnswer}>{answer}</Text>;
              } else {
                answerContent = <Text style={styles.qaAnswer}>{t('guide.answerFailed')}</Text>;
              }
            }

            return (
              <TouchableOpacity
                style={[styles.qaCard, expanded && styles.qaCardExpanded]}
                activeOpacity={0.85}
                onPress={() => handleExpand(item.faqId)}
              >
                <View style={styles.qaHeader}>
                  <Text style={styles.qaLabel}>Q.</Text>
                  <Text style={[styles.qaQuestion, expanded && styles.qaQuestionExpanded]}>
                    {item.question}
                  </Text>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={expanded ? colors.primary[400] : colors.gray[300]}
                  />
                </View>
                {expanded && (
                  <>
                    <View style={styles.divider} />
                    {answerContent}
                  </>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Header title="" />
        <View style={styles.titleRow}>
          <Text style={styles.titleEmoji}>{emoji ?? '📄'}</Text>
          <Text style={styles.title}>{category}</Text>
        </View>
      </View>
      {renderContent()}
    </View>
  );
};

export default CategoryScreen;
