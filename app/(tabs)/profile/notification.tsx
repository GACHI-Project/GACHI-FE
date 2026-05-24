import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Header from '../../../src/components/common/Header';
import Toggle from '../../../src/components/common/Toggle';
import colors from '../../../src/constants/colors';
import fonts from '../../../src/constants/fonts';
import layout from '../../../src/constants/layout';

type NotificationLevel = 'all' | 'important' | 'urgent';

type ItemKey = 'deadline' | 'checklist' | 'weekly' | 'document';

const LEVEL_TABS: NotificationLevel[] = ['all', 'important', 'urgent'];

const LEVEL_LABEL_KEYS: Record<NotificationLevel, string> = {
  all: 'profile.notificationSetting.levelAll',
  important: 'profile.notificationSetting.levelImportant',
  urgent: 'profile.notificationSetting.levelUrgent',
};

const LEVEL_DESC_KEYS: Record<NotificationLevel, string> = {
  all: 'profile.notificationSetting.levelDesc.all',
  important: 'profile.notificationSetting.levelDesc.important',
  urgent: 'profile.notificationSetting.levelDesc.urgent',
};

interface ItemConfig {
  key: ItemKey;
  iconName: React.ComponentProps<typeof Feather>['name'];
  iconColor: string;
  iconBg: string;
  badgeStyle: 'urgent' | 'important' | 'general';
}

const ITEM_CONFIGS: ItemConfig[] = [
  {
    key: 'deadline',
    iconName: 'calendar',
    iconColor: '#E53935',
    iconBg: 'rgba(225,0,0,0.1)',
    badgeStyle: 'urgent',
  },
  {
    key: 'checklist',
    iconName: 'check-square',
    iconColor: '#F4C542',
    iconBg: '#FFFBE6',
    badgeStyle: 'important',
  },
  {
    key: 'weekly',
    iconName: 'mail',
    iconColor: '#F4C542',
    iconBg: '#FFFBE6',
    badgeStyle: 'important',
  },
  {
    key: 'document',
    iconName: 'file-text',
    iconColor: colors.primary[400],
    iconBg: '#D6EAFF',
    badgeStyle: 'general',
  },
];

const LEVEL_PRESETS: Record<NotificationLevel, Record<ItemKey, boolean>> = {
  all: { deadline: true, checklist: true, weekly: true, document: true },
  important: { deadline: true, checklist: true, weekly: true, document: false },
  urgent: { deadline: true, checklist: false, weekly: false, document: false },
};

const ProfileNotificationScreen = () => {
  const { t } = useTranslation();
  const [masterOn, setMasterOn] = useState(true);
  const [level, setLevel] = useState<NotificationLevel>('important');
  const [items, setItems] = useState<Record<ItemKey, boolean>>({
    deadline: true,
    checklist: true,
    weekly: true,
    document: false,
  });

  const handleItemToggle = (key: ItemKey) => {
    const newItems = { ...items, [key]: !items[key] };
    setItems(newItems);
    const matched = Object.entries(LEVEL_PRESETS).find(([, preset]) =>
      Object.keys(preset).every((k) => preset[k as ItemKey] === newItems[k as ItemKey])
    );
    if (matched) setLevel(matched[0] as NotificationLevel);
  };

  const handleLevelChange = (newLevel: NotificationLevel) => {
    setLevel(newLevel);
    setItems(LEVEL_PRESETS[newLevel]);
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('profile.notificationSetting.title')}
        onBack={() => router.push('/(tabs)/profile')}
        onHelp={() => {}}
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 전체 알림 */}
        <Text style={styles.sectionLabel}>{t('profile.notificationSetting.masterSection')}</Text>
        <View style={styles.masterCard}>
          <View style={styles.masterTextWrap}>
            <Text style={styles.masterTitle}>{t('profile.notificationSetting.masterTitle')}</Text>
            <Text style={styles.masterDesc}>{t('profile.notificationSetting.masterDesc')}</Text>
          </View>
          <Toggle value={masterOn} onValueChange={setMasterOn} />
        </View>

        {/* 알림 단계 */}
        <View style={[styles.section, !masterOn && styles.disabled]}>
          <Text style={styles.sectionLabel}>{t('profile.notificationSetting.levelSection')}</Text>
          <View style={styles.segmentWrap}>
            {LEVEL_TABS.map((tab) => {
              const selected = level === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.segmentTab, selected && styles.segmentTabSelected]}
                  onPress={() => handleLevelChange(tab)}
                  disabled={!masterOn}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                    {t(LEVEL_LABEL_KEYS[tab])}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.levelDescBox}>
            <Text style={styles.levelDescText}>{t(LEVEL_DESC_KEYS[level])}</Text>
          </View>
        </View>

        {/* 항목별 알림 */}
        <View style={[styles.section, !masterOn && styles.disabled]}>
          <Text style={styles.sectionLabel}>{t('profile.notificationSetting.itemSection')}</Text>
          <View style={styles.itemCard}>
            {ITEM_CONFIGS.map((config, index) => {
              const isLast = index === ITEM_CONFIGS.length - 1;
              const on = items[config.key];
              return (
                <View key={config.key}>
                  <View style={styles.itemRow}>
                    <View style={[styles.iconBox, { backgroundColor: config.iconBg }]}>
                      <Feather name={config.iconName} size={20} color={config.iconColor} />
                    </View>
                    <View style={styles.itemTextWrap}>
                      <View style={styles.itemTitleRow}>
                        <Text style={styles.itemTitle}>
                          {t(`profile.notificationSetting.items.${config.key}.title`)}
                        </Text>
                        <View
                          style={[
                            styles.badge,
                            config.badgeStyle === 'urgent' && styles.badge_urgent,
                            config.badgeStyle === 'important' && styles.badge_important,
                            config.badgeStyle === 'general' && styles.badge_general,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              config.badgeStyle === 'urgent' && styles.badgeText_urgent,
                              config.badgeStyle === 'important' && styles.badgeText_important,
                              config.badgeStyle === 'general' && styles.badgeText_general,
                            ]}
                          >
                            {t(`profile.notificationSetting.items.${config.key}.badge`)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.itemDesc}>
                        {t(`profile.notificationSetting.items.${config.key}.desc`)}
                      </Text>
                    </View>
                    <Toggle
                      value={on}
                      onValueChange={() => handleItemToggle(config.key)}
                      disabled={!masterOn}
                    />
                  </View>
                  {!isLast && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.scrollBottom} />
      </ScrollView>
    </View>
  );
};

export default ProfileNotificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text.white,
    paddingTop: 60,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.text.white,
  },
  section: {},
  disabled: {
    opacity: 0.4,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.secondary,
    paddingLeft: layout.screenPaddingHorizontal,
    marginTop: 16,
    marginBottom: 10,
  },
  // 전체 알림 카드
  masterCard: {
    backgroundColor: '#FEFEFE',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C8CAD0',
    marginHorizontal: layout.screenPaddingHorizontal,
    paddingHorizontal: 16,
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
  },
  masterTextWrap: {
    flex: 1,
    gap: 6,
  },
  masterTitle: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  masterDesc: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  // 세그먼트
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 10,
    padding: 3,
    height: 36,
    marginHorizontal: layout.screenPaddingHorizontal,
  },
  segmentTab: {
    flex: 1,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentTabSelected: {
    backgroundColor: colors.text.white,
    borderWidth: 0.5,
    borderColor: colors.gray[100],
  },
  segmentText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  segmentTextSelected: {
    fontFamily: fonts.medium,
    color: colors.primary[600],
  },
  // 알림 단계 설명 박스
  levelDescBox: {
    backgroundColor: colors.primary[0],
    borderWidth: 1,
    borderColor: colors.primary[100],
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    marginHorizontal: layout.screenPaddingHorizontal,
  },
  levelDescText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.primary[600],
    lineHeight: 20,
  },
  // 항목별 알림 카드
  itemCard: {
    backgroundColor: '#FEFEFE',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C8CAD0',
    marginHorizontal: layout.screenPaddingHorizontal,
    overflow: 'hidden',
  },
  itemRow: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextWrap: {
    flex: 1,
    gap: 3,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  itemDesc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: '#C8CAD0',
    width: '100%',
  },
  // 뱃지
  badge: {
    height: 21,
    borderRadius: 999,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  badge_urgent: {
    backgroundColor: 'rgba(225,0,0,0.1)',
  },
  badge_important: {
    backgroundColor: '#FFFBE6',
  },
  badge_general: {
    backgroundColor: '#D6EAFF',
  },
  badgeText: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  badgeText_urgent: {
    color: '#E53935',
  },
  badgeText_important: {
    color: '#F4C542',
  },
  badgeText_general: {
    color: colors.primary[400],
  },
  scrollBottom: {
    height: 40,
  },
});
