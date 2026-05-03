import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../src/components/common/Header';
import ScanHelpModal from '../../src/components/scan/ScanHelpModal';
import FullDocTab from '../../src/components/scan/result/FullDocTab';
import ChecklistTab from '../../src/components/scan/result/ChecklistTab';
import AISummaryTab from '../../src/components/scan/result/AISummaryTab';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/scan/result';

const TABS = ['전체 문서', '체크리스트', 'AI 요약'] as const;
type Tab = (typeof TABS)[number];

const MOCK_DOC = {
  title: '봄 현장학습 안내 및 동의서 제출 요청',
  date: '2026년 5월 22일',
  daysLeft: 7,
};

export default function ScanResultScreen() {
  const { photoUri, childName, childGrade } = useLocalSearchParams<{
    photoUri: string;
    childName: string;
    childGrade: string;
  }>();

  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('전체 문서');
  const [helpVisible, setHelpVisible] = useState(false);

  const { daysLeft } = MOCK_DOC;

  return (
    <View style={styles.screen}>
      <Header title="스캔 결과" onHelp={() => setHelpVisible(true)} />

      <View style={styles.docInfo}>
        <Text style={styles.docTitle}>{MOCK_DOC.title}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={13} color={colors.text.secondary} />
            <Text style={styles.metaText}>{MOCK_DOC.date}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="school" size={13} color={colors.text.secondary} />
            <Text style={styles.metaText}>
              {childName} · {childGrade}
            </Text>
          </View>
          <View style={[styles.dBadge, daysLeft <= 3 && styles.dBadgeUrgent]}>
            <Text style={styles.dBadgeText}>D-{daysLeft}</Text>
          </View>
        </View>
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
        {activeTab === '전체 문서' && <FullDocTab photoUri={photoUri ?? ''} />}
        {activeTab === '체크리스트' && <ChecklistTab />}
        {activeTab === 'AI 요약' && <AISummaryTab />}
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
        >
          <Text>💾</Text>
          <Text style={styles.saveBtnText}>저장하기</Text>
        </TouchableOpacity>
      </View>

      <ScanHelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
    </View>
  );
}
