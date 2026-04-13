import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import StepHeader from '../../../src/components/common/StepHeader';
import { PrimaryButton, SecondaryButton } from '../../../src/components/common/Button';
import colors from '../../../src/constants/colors';
import styles from '../../../src/styles/register/notification';
import { NotificationType, NotificationOption } from '../../../src/types/notification';

const NOTIFICATION_OPTIONS: NotificationOption[] = [
  {
    type: 'urgent',
    title: '긴급 알림만',
    description: '마감일 등 꼭 필요한 알림만 받아요',
    iconName: 'alert-circle-outline',
    iconColor: colors.text.red,
    iconBg: colors.text.white,
    iconBordered: true,
  },
  {
    type: 'important',
    title: '중요 알림',
    description: '마감일과 곧 확인이 필요한 내용을 받아요',
    iconName: 'notifications-outline',
    iconColor: colors.secondary[600],
    iconBg: colors.secondary[100],
    badge: '추천',
  },
  {
    type: 'all',
    title: '모든 알림',
    description: '모든 가정통신문과 업데이트, 알림을 받아요',
    iconName: 'mail-outline',
    iconColor: colors.primary[500],
    iconBg: colors.primary[100],
  },
  {
    type: 'none',
    title: '알림 안 받기',
    description: '알림 없이 필요할 때 앱에서 확인해요',
    iconName: 'notifications-off-outline',
    iconColor: colors.gray[300],
    iconBg: colors.gray[100],
    iconFlipped: true,
  },
];

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
  const [selected, setSelected] = useState<NotificationType>('urgent');

  return (
    <View style={styles.container}>
      <StepHeader currentStep={4} totalStep={4} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 타이틀 */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>원하는 알림 방식을 설정해주세요</Text>
          <Text style={styles.subtitle}>알림을 원하는 방식으로 설정해보세요</Text>
        </View>

        {/* 알림 옵션 */}
        <Text style={styles.sectionLabel}>알림 단계</Text>
        {NOTIFICATION_OPTIONS.map((option) => (
          <NotificationCard
            key={option.type}
            option={option}
            selected={selected === option.type}
            onPress={() => setSelected(option.type)}
          />
        ))}

        {/* 안내 배너 */}
        <View style={styles.banner}>
          <Ionicons name="settings" size={18} color={colors.text.primary} />
          <Text style={styles.bannerText}>알림 방식은 설정에서 언제든 변경할 수 있어요</Text>
        </View>

        {/* 버튼 */}
        <View style={styles.buttonGroup}>
          <PrimaryButton
            label="다음으로 →"
            onPress={() => router.push('/(auth)/register/complete')}
          />
          <SecondaryButton
            label="나중에 설정할게요"
            onPress={() => router.push('/(auth)/register/complete')}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default RegisterNotificationScreen;
