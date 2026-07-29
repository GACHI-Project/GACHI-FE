import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Header from '../../src/components/common/Header';
import ConfirmModal from '../../src/components/common/ConfirmModal';
import ScanHelpModal from '../../src/components/scan/ScanHelpModal';
import FullDocTab from '../../src/components/scan/result/FullDocTab';
import ChecklistTab from '../../src/components/scan/result/ChecklistTab';
import AISummaryTab from '../../src/components/scan/result/AISummaryTab';
import SaveBottomSheet from '../../src/components/scan/result/SaveBottomSheet';
import ScanDocInfo from '../../src/components/scan/result/ScanDocInfo';
import ScanTabBar, { type Tab } from '../../src/components/scan/result/ScanTabBar';
import useNewsletterDetail from '../../src/hooks/scan/useNewsletterDetail';
import { formatDate } from '../../src/utils/date';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/scan/result';

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
  const { i18n, t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('full');
  const [helpVisible, setHelpVisible] = useState(false);
  const [saveVisible, setSaveVisible] = useState(false);
  const [unsavedVisible, setUnsavedVisible] = useState(false);

  const { detail, loading: detailLoading } = useNewsletterDetail(newsletterId);

  const handleBack = useCallback(() => {
    setUnsavedVisible(true);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setUnsavedVisible(true);
      return true;
    });
    return () => sub.remove();
  }, []);

  const displayTitle = detail?.title ?? '';
  const displayChildName = detail?.childName ?? childNameParam ?? '';
  const displayDate = detail ? formatDate(detail.createdAt, i18n.language) : '';

  return (
    <View style={styles.screen}>
      <Header
        title={t('scan.result.title')}
        onBack={handleBack}
        onHelp={() => setHelpVisible(true)}
      />

      <View style={styles.content}>
        <ScanDocInfo
          loading={detailLoading}
          title={displayTitle}
          date={displayDate}
          childName={displayChildName}
          childGrade={childGrade}
        />

        <ScanTabBar activeTab={activeTab} onTabChange={setActiveTab} />
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

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.chatBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('scan.result.chat')}
        >
          <Text style={styles.btnIcon} allowFontScaling={false}>
            💬
          </Text>
          <Text style={styles.chatBtnText} numberOfLines={1}>
            {t('scan.result.chat')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('scan.result.save')}
          onPress={() => setSaveVisible(true)}
        >
          <Text style={styles.btnIcon} allowFontScaling={false}>
            💾
          </Text>
          <Text style={styles.saveBtnText} numberOfLines={1}>
            {t('scan.result.save')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScanHelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
      <ConfirmModal
        visible={unsavedVisible}
        onClose={() => setUnsavedVisible(false)}
        icon={<Ionicons name="save" size={30} color={colors.primary[600]} />}
        title={t('scan.result.unsavedAlert.title')}
        description={t('scan.result.unsavedAlert.message')}
        cancelText={t('scan.result.unsavedAlert.cancel')}
        onCancel={() => setUnsavedVisible(false)}
        confirmText={t('scan.result.unsavedAlert.confirm')}
        onConfirm={() => router.replace('/(tabs)')}
      />
      <SaveBottomSheet
        visible={saveVisible}
        onClose={() => setSaveVisible(false)}
        onConfirm={() => router.replace('/(tabs)/calendar')}
        onDismiss={() => router.replace('/(tabs)')}
        childName={displayChildName}
        newsletterId={newsletterId}
        newsletterTitle={displayTitle}
      />
    </View>
  );
};

export default ScanResultScreen;
