import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../src/components/common/Header';
import colors from '../../src/constants/colors';
import layout from '../../src/constants/layout';
import styles from '../../src/styles/guide/categoryScreen';
import {
  getSchoolGuideFaqs,
  type SchoolGuideCategoryEnum,
  type SchoolGuideFaqItem,
} from '../../src/api/schoolGuide';
import useGuideFaqExpand from '../../src/hooks/guide/useGuideFaqExpand';

const CategoryScreen = () => {
  const { category, categoryEnum, emoji } = useLocalSearchParams<{
    category: string;
    categoryEnum: string;
    emoji: string;
  }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [faqs, setFaqs] = useState<SchoolGuideFaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { expandedId, answerCache, loadingDetailId, handleExpand } = useGuideFaqExpand();

  useEffect(() => {
    if (!categoryEnum) {
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    getSchoolGuideFaqs({ category: categoryEnum as SchoolGuideCategoryEnum })
      .then(setFaqs)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [categoryEnum]);

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
          <Text style={styles.errorText}>{t('guide.loadFailed')}</Text>
        </View>
      );
    }
    return (
      <>
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
