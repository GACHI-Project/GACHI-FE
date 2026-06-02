import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Header from '../../src/components/common/Header';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/guide/categoryScreen';

interface QAItem {
  id: string;
  question: string;
  answer: string;
  tag: string;
}

interface CategoryData {
  tabs: string[];
  items: QAItem[];
}

const CategoryScreen = () => {
  const { category, categoryKey, emoji } = useLocalSearchParams<{
    category: string;
    categoryKey: string;
    emoji: string;
  }>();
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const raw = t(`guide.qa.${categoryKey ?? ''}`, { returnObjects: true });
  const data: CategoryData =
    raw && typeof raw === 'object' && 'tabs' in raw
      ? (raw as CategoryData)
      : { tabs: [t('common.all')], items: [] };

  const allTab = data.tabs[0] ?? t('common.all');
  const activeTab = selectedTab || allTab;

  const filteredItems =
    activeTab === allTab ? data.items : data.items.filter((q) => q.tag === activeTab);

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Header title="" />

        <View style={styles.titleRow}>
          <Text style={styles.titleEmoji}>{emoji ?? '📄'}</Text>
          <Text style={styles.title}>{category}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBar}
          contentContainerStyle={styles.tabContent}
        >
          {data.tabs.map((tab) => {
            const isSelected = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, isSelected && styles.tabSelected]}
                onPress={() => setSelectedTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {(() => {
            const parts = t('guide.totalCount', { count: filteredItems.length }).split(
              String(filteredItems.length)
            );
            return (
              <>
                <Text key="prefix">{parts[0]}</Text>
                <Text key="count">
                  <Text style={styles.countBold}>{filteredItems.length}</Text>
                  {parts[1]}
                </Text>
              </>
            );
          })()}
        </Text>
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={filteredItems}
        keyExtractor={(item) => item.id}
        extraData={expandedId}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const expanded = expandedId === item.id;
          return (
            <TouchableOpacity
              style={[styles.qaCard, expanded && styles.qaCardExpanded]}
              activeOpacity={0.85}
              onPress={() => setExpandedId(expanded ? null : item.id)}
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
                  <Text style={styles.qaAnswer}>{item.answer}</Text>
                </>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

export default CategoryScreen;
