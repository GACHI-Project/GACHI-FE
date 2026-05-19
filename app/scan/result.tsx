import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../src/components/common/Header';
import ScanHelpModal from '../../src/components/scan/ScanHelpModal';
import FullDocTab from '../../src/components/scan/result/FullDocTab';
import ChecklistTab from '../../src/components/scan/result/ChecklistTab';
import AISummaryTab from '../../src/components/scan/result/AISummaryTab';
import SaveBottomSheet from '../../src/components/scan/result/SaveBottomSheet';
import { getNewsletterDetail, type NewsletterDetail } from '../../src/api/newsletter';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/scan/result';

const TABS = ['전체 문서', '체크리스트', 'AI 요약'] as const;
type Tab = (typeof TABS)[number];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};

export default function ScanResultScreen() {
  const { childName: childNameParam, childGrade, newsletterId: newsletterIdParam } = useLocalSearchParams<{
    childName: string;
    childGrade: string;
    newsletterId: string;
  }>();
  const newsletterId = newsletterIdParam ? Number(newsletterIdParam) : undefined;

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('전체 문서');
  const [helpVisible, setHelpVisible] = useState(false);
  const [saveVisible, setSaveVisible] = useState(false);

  const [detail, setDetail] = useState<NewsletterDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(!!newsletterIdParam);

  useEffect(() => {
    if (!newsletterId) {
      setDetailLoading(false);
      return;
    }
    getNewsletterDetail(newsletterId)
      .then(setDetail)
      .catch(() => {
        // 헤더 정보 로드 실패 시 route param fallback으로 표시
      })
      .finally(() => setDetailLoading(false));
  }, [newsletterId]);

  const displayTitle = detail?.title ?? '';
  const displayChildName = detail?.childName ?? childNameParam ?? '';
  const displayDate = detail ? formatDate(detail.createdAt) : '';

  return (
    <View style={styles.screen}>
      <Header title="스캔 결과" onHelp={() => setHelpVisible(true)} />

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
              {(displayChildName || childGrade) ? (
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
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tab}</Text>
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
        {activeTab === '전체 문서' && <FullDocTab newsletterId={newsletterId} />}
        {activeTab === '체크리스트' && <ChecklistTab newsletterId={newsletterId} />}
        {activeTab === 'AI 요약' && <AISummaryTab newsletterId={newsletterId} />}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.chatBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="AI와 대화하기"
        >
          <Text>💬</Text>
          <Text style={styles.chatBtnText}>AI와 대화하기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="저장하기"
          onPress={() => setSaveVisible(true)}
        >
          <Text>💾</Text>
          <Text style={styles.saveBtnText}>저장하기</Text>
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
}
