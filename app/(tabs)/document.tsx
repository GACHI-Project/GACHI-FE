import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import colors from '../../src/constants/colors';
import fonts from '../../src/constants/fonts';
import layout from '../../src/constants/layout';
import { DocumentItem } from '../../src/mock/documents';
import { fetchChildren, ChildItem } from '../../src/api/child';
import { fetchNewsletters, NewsletterItem } from '../../src/api/newsletter';
import DocumentCard from '../../src/components/document/DocumentCard';
import Header from '../../src/components/common/Header';

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
};

const toDocumentItem = (doc: NewsletterItem): DocumentItem => ({
  id: String(doc.newsletterId),
  childId: doc.childName ?? '',
  childName: doc.childName ?? '',
  grade: doc.childGrade,
  calendarColor: doc.childColor ?? colors.primary[400],
  title: doc.title,
  date: formatDate(doc.createdAt),
});

const DocumentScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const [children, setChildren] = useState<ChildItem[]>([]);
  const [newsletters, setNewsletters] = useState<NewsletterItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedChildName, setSelectedChildName] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const selectedChildNameRef = useRef(selectedChildName);
  const searchQueryRef = useRef(searchQuery);

  useEffect(() => {
    selectedChildNameRef.current = selectedChildName;
  }, [selectedChildName]);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    fetchChildren()
      .then(setChildren)
      .catch(() => {});
  }, []);

  const loadNewsletters = async (childName?: string, search?: string) => {
    setIsLoading(true);
    setPage(0);
    try {
      const result = await fetchNewsletters({ childName, search, page: 0 });
      setNewsletters(result.newsletters);
      setTotalCount(result.totalCount);
    } catch {
      // 목록 조회 실패 시 목록 유지
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    if (isLoadingMoreRef.current || isLoading || newsletters.length >= totalCount) return;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const result = await fetchNewsletters({
        childName: selectedChildName,
        search: searchQuery.trim() || undefined,
        page: nextPage,
      });
      setNewsletters((prev) => [...prev, ...result.newsletters]);
      setPage(nextPage);
    } catch {
      // 추가 목록 조회 실패
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      loadNewsletters(selectedChildName, searchQuery.trim() || undefined);
    }, 500);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, selectedChildName]); // eslint-disable-line react-hooks/exhaustive-deps

  useFocusEffect(
    useCallback(() => {
      if (!isMountedRef.current) {
        isMountedRef.current = true;
        return;
      }
      loadNewsletters(selectedChildNameRef.current, searchQueryRef.current.trim() || undefined);
    }, []) // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleChildFilter = (childName: string | undefined) => {
    setSelectedChildName(childName);
  };

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator color={colors.primary[400]} style={styles.loader} />;
    }
    if (newsletters.length === 0) {
      return <Text style={styles.emptyText}>{t('document.empty')}</Text>;
    }
    return newsletters.map((doc) => (
      <DocumentCard
        key={doc.newsletterId}
        item={toDocumentItem(doc)}
        onPress={() => router.push(`/newsletter/${doc.newsletterId}`)}
      />
    ));
  };

  return (
    <View style={styles.container}>
      <Header title={t('document.title')} />
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={25} color={colors.gray[200]} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('document.searchPlaceholder')}
          placeholderTextColor={colors.gray[200]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterBtn, selectedChildName === undefined && styles.filterBtnSelected]}
          onPress={() => handleChildFilter(undefined)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterText,
              selectedChildName === undefined && styles.filterTextSelected,
            ]}
          >
            {t('common.all')}
          </Text>
        </TouchableOpacity>

        {children.map((child) => {
          const selected = selectedChildName === child.name;
          return (
            <TouchableOpacity
              key={child.id}
              style={[styles.filterBtn, selected && styles.filterBtnSelected]}
              onPress={() => handleChildFilter(child.name)}
              activeOpacity={0.7}
            >
              <View style={[styles.childDot, { backgroundColor: child.colorCode }]} />
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                {child.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
          if (isBottom) loadMore();
        }}
        scrollEventThrottle={400}
      >
        {renderContent()}
        {isLoadingMore && (
          <ActivityIndicator
            size="small"
            color={colors.primary[400]}
            style={styles.loadMoreIndicator}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default DocumentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: colors.text.white,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 14,
    paddingTop: 4,
    paddingBottom: 34,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: layout.screenPaddingHorizontal,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    padding: 0,
  },
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  list: {
    flex: 1,
  },
  filterContent: {
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: 16,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.text.white,
    gap: 6,
  },
  filterBtnSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  filterText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.secondary,
  },
  filterTextSelected: {
    color: colors.text.white,
  },
  childDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.gray[300],
  },
  loader: {
    marginTop: 40,
  },
  loadMoreIndicator: {
    marginVertical: 16,
  },
});
