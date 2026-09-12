import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import StepHeader from '../../../src/components/common/StepHeader';
import { PrimaryButton, SecondaryButton } from '../../../src/components/common/Button';
import colors from '../../../src/constants/colors';
import styles from '../../../src/styles/register/notification';
import {
  NotificationType,
  NotificationOption,
  toServerNotificationPreference,
} from '../../../src/types/notification';
import { useRegisterStore } from '../../../src/store/registerStore';

// ─── NotificationCard ─────────────────────────────────────────────────────────

interface NotificationCardProps {
  option: NotificationOption;
  selected: boolean;
  onPress: () => void;
}

const NotificationCard = ({ option, selected, onPress }: NotificationCardProps) => (
  <TouchableOpacity
    style={[styles.card, selected && styles.cardSelected]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    {selected && <View style={styles.selectedBar} />}
    <View
      style={[
        styles.iconBox,
        { backgroundColor: option.iconBg },
        option.iconBordered && styles.iconBoxBordered,
      ]}
    >
      <Ionicons
        name={option.iconName}
        size={24}
        color={option.iconColor}
        style={option.iconFlipped ? styles.iconFlipped : undefined}
      />
    </View>

    <View style={styles.cardContent}>
      <View style={styles.cardTitleRow}>
        <Text style={styles.cardTitle}>{option.title}</Text>
        {option.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{option.badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardDescription}>{option.description}</Text>
    </View>

    <View style={[styles.radio, selected && styles.radioSelected]} />
  </TouchableOpacity>
);

// ─── 메인 화면 ────────────────────────────────────────────────────────────────

const RegisterNotificationScreen = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<NotificationType>('important');
  const setNotificationPreference = useRegisterStore((s) => s.setNotificationPreference);

  const NOTIFICATION_OPTIONS: NotificationOption[] = [
    {
      type: 'important',
      title: t('auth.register.notification.options.important.title'),
      description: t('auth.register.notification.options.important.desc'),
      iconName: 'notifications-outline',
      iconColor: colors.secondary[600],
      iconBg: colors.secondary[100],
      badge: t('auth.register.notification.options.important.badge'),
    },
    {
      type: 'urgent',
      title: t('auth.register.notification.options.urgent.title'),
      description: t('auth.register.notification.options.urgent.desc'),
      iconName: 'alert-circle-outline',
      iconColor: colors.text.red,
      iconBg: colors.text.white,
      iconBordered: true,
    },
    {
      type: 'all',
      title: t('auth.register.notification.options.all.title'),
      description: t('auth.register.notification.options.all.desc'),
      iconName: 'mail-outline',
      iconColor: colors.primary[500],
      iconBg: colors.primary[100],
    },
    {
      type: 'none',
      title: t('auth.register.notification.options.none.title'),
      description: t('auth.register.notification.options.none.desc'),
      iconName: 'notifications-off-outline',
      iconColor: colors.gray[300],
      iconBg: colors.gray[100],
      iconFlipped: true,
    },
  ];

  return (
    <View style={styles.container}>
      <StepHeader currentStep={4} totalStep={4} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('auth.register.notification.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.register.notification.subtitle')}</Text>
        </View>

        <Text style={styles.sectionLabel}>{t('auth.register.notification.sectionLabel')}</Text>
        {NOTIFICATION_OPTIONS.map((option) => (
          <NotificationCard
            key={option.type}
            option={option}
            selected={selected === option.type}
            onPress={() => setSelected(option.type)}
          />
        ))}

        <View style={styles.footer}>
          <View style={styles.banner}>
            <Ionicons name="settings" size={18} color={colors.text.primary} />
            <Text style={styles.bannerText}>{t('auth.register.notification.settingsTip')}</Text>
          </View>
          <PrimaryButton
            label={t('common.next')}
            onPress={() => {
              setNotificationPreference(toServerNotificationPreference(selected));
              router.push('/(auth)/register/complete');
            }}
          />
          <SecondaryButton
            label={t('common.later')}
            onPress={() => router.push('/(auth)/register/complete')}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default RegisterNotificationScreen;
