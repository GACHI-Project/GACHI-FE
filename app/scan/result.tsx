import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Header from '../../src/components/common/Header';
import ScanHelpModal from '../../src/components/scan/ScanHelpModal';
import FullDocTab from '../../src/components/scan/result/FullDocTab';
import ChecklistTab from '../../src/components/scan/result/ChecklistTab';
import AISummaryTab from '../../src/components/scan/result/AISummaryTab';
import SaveBottomSheet from '../../src/components/scan/result/SaveBottomSheet';
import { getNewsletterDetail, type NewsletterDetail } from '../../src/api/newsletter';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/scan/result';

const TABS = ['full', 'checklist', 'aiSummary'] as const;
type Tab = (typeof TABS)[number];

const formatDate = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(
    new Date(iso)
  );

const ScanResultScreen = () => {
  const {
    childName: childNameParam,
    childGrade,
    newsletterId: newsletterIdParam,
  } = useLocalSearchParams<{
    childName: string;
    childGrade: string;
    newsletterId: string;
  }>();
  const newsletterId = newsletterIdParam ? Number(newsletterIdParam) : undefined;

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('full');
  const [helpVisible, setHelpVisible] = useState(false);
  const [saveVisible, setSaveVisible] = useState(false);

  const [detail, setDetail] = useState<NewsletterDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(!!newsletterIdParam);

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

  const displayTitle = detail?.title ?? '';
  const displayChildName = detail?.childName ?? childNameParam ?? '';
  const displayDate = detail ? formatDate(detail.createdAt, i18n.language) : '';

  return (
    <View style={styles.screen}>
      <Header title={t('scan.result.title')} onHelp={() => setHelpVisible(true)} />

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
              {displayChildName || childGrade ? (
                <View style={styles.metaItem}>
                  <Ionicons name="school" size={13} color={colors.text.secondary} />
                  <Text style={styles.metaText}>
                    {displayChildName}
                    {displayChildName && childGrade ? ' · ' : ''}
                    {childGrade ?? ''}
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        )}
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => setActiveTab(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{t(`scan.result.tabs.${tab}`)}</Text>
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

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.chatBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('scan.result.chat')}
        >
          <Text>💬</Text>
          <Text style={styles.chatBtnText}>{t('scan.result.chat')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('scan.result.save')}
          onPress={() => setSaveVisible(true)}
        >
          <Text>💾</Text>
          <Text style={styles.saveBtnText}>{t('scan.result.save')}</Text>
        </TouchableOpacity>
      </View>

      <ScanHelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
      <SaveBottomSheet
        visible={saveVisible}
        onClose={() => setSaveVisible(false)}
        onConfirm={() => router.replace('/(tabs)/calendar')}
        onDismiss={() => router.replace('/(tabs)')}
        childName={displayChildName}
        newsletterId={newsletterId}
      />
    </View>
  );
};

export default ScanResultScreen;
