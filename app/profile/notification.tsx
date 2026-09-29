import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../src/components/common/Header';
import Toggle from '../../src/components/common/Toggle';
import {
  fetchMyInfo,
  updateNotificationPreference,
  type NotificationPreference,
} from '../../src/api/user';
import layout from '../../src/constants/layout';
import styles from '../../src/styles/profile/profileNotification';

type NotificationLevel = 'all' | 'important' | 'urgent';

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

const prefToLevel = (pref: NotificationPreference): NotificationLevel => {
  if (pref === 'ALL') return 'all';
  if (pref === 'URGENT_ONLY') return 'urgent';
  return 'important';
};

const levelToPref = (lv: NotificationLevel): NotificationPreference => {
  if (lv === 'all') return 'ALL';
  if (lv === 'urgent') return 'URGENT_ONLY';
  return 'IMPORTANT';
};

const ProfileNotificationScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [masterOn, setMasterOn] = useState(true);
  const [level, setLevel] = useState<NotificationLevel>('important');

  useEffect(() => {
    fetchMyInfo()
      .then((user) => {
        const pref = user.notificationPreference as NotificationPreference;
        if (pref === 'OFF') {
          setMasterOn(false);
        } else {
          const lv = prefToLevel(pref);
          setMasterOn(true);
          setLevel(lv);
        }
      })
      .catch(() => {});
  }, []);

  const handleMasterToggle = async (value: boolean) => {
    setMasterOn(value);
    if (!value) {
      await updateNotificationPreference('OFF').catch(() => setMasterOn(true));
    } else {
      await updateNotificationPreference(levelToPref(level)).catch(() => setMasterOn(false));
    }
  };

  const handleLevelChange = async (newLevel: NotificationLevel) => {
    setLevel(newLevel);
    await updateNotificationPreference(levelToPref(newLevel)).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <Header title={t('profile.notificationSetting.title')} onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + layout.screenPaddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* 전체 알림 */}
        <Text style={styles.sectionLabel}>{t('profile.notificationSetting.masterSection')}</Text>
        <View style={styles.masterCard}>
          <View style={styles.masterTextWrap}>
            <Text style={styles.masterTitle}>{t('profile.notificationSetting.masterTitle')}</Text>
            <Text style={styles.masterDesc}>{t('profile.notificationSetting.masterDesc')}</Text>
          </View>
          <Toggle value={masterOn} onValueChange={handleMasterToggle} />
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

        <View style={styles.scrollBottom} />
      </ScrollView>
    </View>
  );
};

export default ProfileNotificationScreen;
