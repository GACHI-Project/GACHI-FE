import { isCancel } from 'axios';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type NotificationPreference } from '../../src/api/user';
import Header from '../../src/components/common/Header';
import QueryNotice from '../../src/components/common/QueryNotice';
import Toggle from '../../src/components/common/Toggle';
import layout from '../../src/constants/layout';
import { useApiMutation } from '../../src/query/hooks';
import { saveNotificationPreference } from '../../src/query/profile';
import { useProfileQuery } from '../../src/query/resources';
import { hasBlockingQueryError } from '../../src/query/state';
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
  const updateNotificationPreference = useApiMutation(saveNotificationPreference, ['profile']);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const profile = useProfileQuery();
  const [draft, setDraft] = useState<{ masterOn: boolean; level: NotificationLevel } | null>(null);
  const [lastEnabledLevel, setLastEnabledLevel] = useState<NotificationLevel>('important');
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  const pref = profile.data?.notificationPreference as NotificationPreference | undefined;
  const masterOn = draft?.masterOn ?? pref !== 'OFF';
  const level =
    draft?.level ?? (pref === 'OFF' ? lastEnabledLevel : prefToLevel(pref ?? 'IMPORTANT'));
  const controlsDisabled = isSaving || !profile.data;

  const savePreference = async (enabled: boolean, nextLevel: NotificationLevel) => {
    if (saving.current || !profile.data) return;
    saving.current = true;
    setIsSaving(true);
    setDraft({ masterOn: enabled, level: nextLevel });
    try {
      await updateNotificationPreference(enabled ? levelToPref(nextLevel) : 'OFF');
      setLastEnabledLevel(nextLevel);
    } catch (error) {
      if (!isCancel(error)) Alert.alert(t('common.error'), t('common.networkError'));
    } finally {
      saving.current = false;
      setIsSaving(false);
      setDraft(null);
    }
  };

  const handleMasterToggle = (value: boolean) => savePreference(value, level);
  const handleLevelChange = async (nextLevel: NotificationLevel) => {
    if (masterOn) await savePreference(true, nextLevel);
  };

  if (!profile.data || hasBlockingQueryError(profile)) {
    return (
      <View style={styles.container}>
        <Header title={t('profile.notificationSetting.title')} onBack={() => router.back()} />
        <QueryNotice
          loading={!profile.error && profile.isPending}
          message={profile.isPaused ? t('common.waitingConnection') : undefined}
          onRetry={() => {
            void profile.refetch();
          }}
          retrying={profile.isFetching}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={t('profile.notificationSetting.title')} onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + layout.screenPaddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        {profile.error && (
          <QueryNotice
            message={t('common.refreshFailed')}
            onRetry={() => {
              void profile.refetch();
            }}
            retrying={profile.isFetching}
          />
        )}
        {/* 전체 알림 */}
        <Text style={styles.sectionLabel}>{t('profile.notificationSetting.masterSection')}</Text>
        <View style={styles.masterCard}>
          <View style={styles.masterTextWrap}>
            <Text style={styles.masterTitle}>{t('profile.notificationSetting.masterTitle')}</Text>
            <Text style={styles.masterDesc}>{t('profile.notificationSetting.masterDesc')}</Text>
          </View>
          <Toggle value={masterOn} onValueChange={handleMasterToggle} disabled={controlsDisabled} />
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
                  disabled={controlsDisabled || !masterOn}
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
