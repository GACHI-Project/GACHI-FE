import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import styles from '../../../styles/scan/result';

export const TABS = ['full', 'checklist', 'aiSummary'] as const;
export type Tab = (typeof TABS)[number];

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const ScanTabBar = ({ activeTab, onTabChange }: Props) => {
  const { t } = useTranslation();
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={styles.tab}
          onPress={() => onTabChange(tab)}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === tab }}
        >
          <Text
            style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}
            numberOfLines={1}
          >
            {t(`scan.result.tabs.${tab}`)}
          </Text>
          {activeTab === tab && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default ScanTabBar;
