import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Header from '../../src/components/common/Header';
import FullDocTab from '../../src/components/scan/result/FullDocTab';
import ChecklistTab from '../../src/components/scan/result/ChecklistTab';
import AISummaryTab from '../../src/components/scan/result/AISummaryTab';
import { getNewsletterDetail, type NewsletterDetail } from '../../src/api/newsletter';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/scan/result';

const TABS_ALL = ['full', 'checklist', 'aiSummary'] as const;
const TABS_NO_CHECKLIST = ['full', 'aiSummary'] as const;
type Tab = (typeof TABS_ALL)[number];

const formatDate = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(
    new Date(iso)
  );

const NewsletterDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const newsletterId = id ? Number(id) : undefined;

  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('full');
  const [detail, setDetail] = useState<NewsletterDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(!!id);

  useEffect(() => {
    if (!newsletterId) {
      setDetail(null);
      setDetailLoading(false);
      return () => {};
    }
    let cancelled = false;
    setDetail(null);
    setDetailLoading(true);

    getNewsletterDetail(newsletterId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [newsletterId]);

  const tabs = detail?.isCalendarRegistered ? TABS_ALL : TABS_NO_CHECKLIST;
  const displayTitle = detail?.title ?? '';
  const displayChildName = detail?.childName ?? '';
  const displayDate = detail ? formatDate(detail.createdAt, i18n.language) : '';

  return (
    <View style={styles.screen}>
      <Header title={t('document.detail')} />

      <View style={styles.docInfo}>
        {detailLoading ? (
          <ActivityIndicator size="small" color={colors.primary[400]} />
        ) : (
          <>
            <Text style={styles.docTitle}>{displayTitle}</Text>
            <View style={styles.metaRow}>
              {displayDate ? (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar" size={13} color={colors.text.secondary} />
                  <Text style={styles.metaText}>{displayDate}</Text>
                </View>
              ) : null}
              {displayChildName ? (
                <View style={styles.metaItem}>
                  <Ionicons name="school" size={13} color={colors.text.secondary} />
                  <Text style={styles.metaText}>{displayChildName}</Text>
                </View>
              ) : null}
            </View>
          </>
        )}
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => setActiveTab(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {t(`scan.result.tabs.${tab}`)}
            </Text>
            {activeTab === tab && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.tabDivider} />

      <ScrollView
        style={[styles.scrollView, styles.scrollViewTinted]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
      >
        {activeTab === 'full' && <FullDocTab newsletterId={newsletterId} />}
        {activeTab === 'checklist' && <ChecklistTab newsletterId={newsletterId} />}
        {activeTab === 'aiSummary' && <AISummaryTab newsletterId={newsletterId} />}
      </ScrollView>
    </View>
  );
};

export default NewsletterDetailScreen;
