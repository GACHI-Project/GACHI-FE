import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Header from '../../src/components/common/Header';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/guide/guideScreen';
import {
  getSchoolGuideCategories,
  getPopularFaqs,
  getSchoolGuideFaqs,
  getSchoolGuideFaqDetail,
  type SchoolGuideCategory,
  type PopularFaq,
  type SchoolGuideFaqItem,
} from '../../src/api/schoolGuide';

const CATEGORY_EMOJIS = [
  ['📄', '📅', '🏫', '🍱'],
  ['🎒', '📚', '📝', '💬'],
  ['🏥', '📐', '🌐', '🐣'],
];

const KEY_TO_ENUM: Record<string, string> = {
  documents: 'DOCUMENTS',
  attendance: 'ATTENDANCE',
  events: 'SCHOOL_EVENTS',
  meals: 'MEALS',
  afterschool: 'AFTERSCHOOL',
  subjects: 'CURRICULUM',
  grades: 'GRADES',
  teacher: 'TEACHER_COMMUNICATION',
  health: 'HEALTH_SAFETY',
  rules: 'SCHOOL_RULES',
  multicultural: 'MULTICULTURAL',
  enrollment: 'ADMISSION',
};

interface CategoryItem {
  name: string;
  key: string;
}

interface Section {
  label: string;
  categories: CategoryItem[];
}

const GuideScreen = () => {
  const { t } = useTranslation();

  const rawSections = t('guide.sections', { returnObjects: true });
  const sections = Array.isArray(rawSections) ? (rawSections as Section[]) : [];

  const [categories, setCategories] = useState<SchoolGuideCategory[]>([]);
  const [popularFaqs, setPopularFaqs] = useState<PopularFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SchoolGuideFaqItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [answerCache, setAnswerCache] = useState<Record<number, string>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);

  const searchInputRef = useRef<TextInput>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSearchReqId = useRef(0);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  useEffect(() => {
    Promise.all([getSchoolGuideCategories(), getPopularFaqs()])
      .then(([cats, faqs]) => {
        setCategories(cats);
        setPopularFaqs(faqs);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const categoryMap = new Map<string, number>(categories.map((c) => [c.category, c.count]));

  const openSearch = () => {
    setIsSearching(true);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const closeSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
    setSearchResults([]);
    setExpandedId(null);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setExpandedId(null);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!text.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    debounceTimer.current = setTimeout(() => {
      const reqId = ++lastSearchReqId.current;
      getSchoolGuideFaqs({ search: text.trim() })
        .then((items) => {
          if (reqId !== lastSearchReqId.current) return;
          setSearchResults(items);
        })
        .catch(() => {
          if (reqId !== lastSearchReqId.current) return;
          setSearchResults([]);
        })
        .finally(() => {
          if (reqId === lastSearchReqId.current) setSearchLoading(false);
        });
    }, 300);
  };

  const handleExpandFaq = (faqId: number) => {
    if (expandedId === faqId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(faqId);
    if (answerCache[faqId] !== undefined) return;

    setLoadingDetailId(faqId);
    getSchoolGuideFaqDetail(faqId)
      .then((detail) => setAnswerCache((prev) => ({ ...prev, [faqId]: detail.answer })))
      .catch(() => {})
      .finally(() => setLoadingDetailId(null));
  };

  const renderSearchContent = () => {
    if (searchLoading) {
      return <ActivityIndicator color={colors.primary[400]} style={styles.searchSpinner} />;
    }
    if (!searchQuery.trim()) {
      return <Text style={styles.searchEmptyText}>{t('guide.searchHint')}</Text>;
    }
    if (searchResults.length === 0) {
      return <Text style={styles.searchEmptyText}>{t('guide.searchEmpty')}</Text>;
    }
    return (
      <FlatList
        data={searchResults}
        keyExtractor={(item) => String(item.faqId)}
        extraData={{ expandedId, answerCache, loadingDetailId }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.searchResultsList}
        renderItem={({ item }) => {
          const expanded = expandedId === item.faqId;
          const answer = answerCache[item.faqId];
          const detailLoading = loadingDetailId === item.faqId;
          return (
            <TouchableOpacity
              style={[styles.searchResultCard, expanded && styles.searchResultCardExpanded]}
              activeOpacity={0.85}
              onPress={() => handleExpandFaq(item.faqId)}
            >
              <View style={styles.searchResultHeader}>
                <Text style={styles.qaLabel}>Q.</Text>
                <Text
                  style={[
                    styles.searchResultQuestion,
                    expanded && styles.searchResultQuestionExpanded,
                  ]}
                >
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
                  <View style={styles.searchResultDivider} />
                  {detailLoading ? (
                    <ActivityIndicator color={colors.primary[400]} style={styles.detailSpinner} />
                  ) : (
                    <Text style={styles.searchResultAnswer}>{answer}</Text>
                  )}
                </>
              )}
            </TouchableOpacity>
          );
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <Header title="" />
      </View>

      {isSearching ? (
        <View style={styles.searchActiveContainer}>
          <View style={styles.searchActiveBar}>
            <Ionicons name="search-outline" size={18} color={colors.gray[300]} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder={t('guide.searchPlaceholder')}
              placeholderTextColor={colors.gray[300]}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearchChange('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.gray[300]} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={closeSearch} hitSlop={8}>
            <Text style={styles.searchCancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {isSearching ? (
        <View style={styles.searchResultsContainer}>{renderSearchContent()}</View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSection}>
            <Text style={styles.title}>{t('guide.title')}</Text>
            <Text style={styles.subtitle}>{t('guide.subtitle')}</Text>
            <TouchableOpacity
              style={styles.searchBar}
              activeOpacity={0.7}
              accessibilityRole="search"
              onPress={openSearch}
            >
              <Ionicons name="search-outline" size={18} color={colors.gray[300]} />
              <Text style={styles.searchPlaceholder}>{t('guide.searchPlaceholder')}</Text>
            </TouchableOpacity>
          </View>

          {loadError && (
            <Text style={styles.searchEmptyText}>{t('guide.loadFailed')}</Text>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('guide.popularTitle')}</Text>
            {loading ? (
              <ActivityIndicator color={colors.primary[400]} style={styles.detailSpinner} />
            ) : (
              popularFaqs.map((faq) => (
                <TouchableOpacity
                  key={faq.faqId}
                  style={styles.popularCard}
                  activeOpacity={0.7}
                  onPress={() => {}}
                >
                  <Text style={styles.popularQ}>Q.</Text>
                  <Text style={styles.popularText}>{faq.question}</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.gray[300]} />
                </TouchableOpacity>
              ))
            )}
          </View>

          {sections.map((section, sectionIndex) => (
            <View key={section.label} style={styles.section}>
              <Text style={styles.sectionLabel}>{section.label}</Text>
              <View style={styles.categoryGrid}>
                {section.categories.map((cat, catIndex) => {
                  const categoryEnum = KEY_TO_ENUM[cat.key];
                  const count = categoryEnum ? (categoryMap.get(categoryEnum) ?? 0) : 0;
                  const emoji = CATEGORY_EMOJIS[sectionIndex]?.[catIndex] ?? '📌';
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={styles.categoryCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (!categoryEnum) return;
                        router.push({
                          pathname: '/guide/[category]',
                          params: {
                            category: cat.name,
                            categoryEnum,
                            emoji,
                          },
                        });
                      }}
                    >
                      <Text style={styles.categoryEmoji}>{emoji}</Text>
                      <View style={styles.categoryTexts}>
                        <Text style={styles.categoryName}>{cat.name}</Text>
                        {loading ? (
                          <ActivityIndicator size="small" color={colors.primary[300]} />
                        ) : (
                          <Text style={styles.categoryCount}>
                            {t('guide.questionCount', { count })}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default GuideScreen;
