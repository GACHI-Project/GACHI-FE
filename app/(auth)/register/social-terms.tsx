import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import StepHeader from '../../../src/components/common/StepHeader';
import { PrimaryButton } from '../../../src/components/common/Button';
import colors from '../../../src/constants/colors';
import styles from '../../../src/styles/register/socialTerms';
import { useRegisterStore } from '../../../src/store/registerStore';

type TermsKey = 'age' | 'terms' | 'privacy';

interface TermsItem {
  key: TermsKey;
  required: boolean;
  labelKey: string;
  route?: '/(auth)/register/terms' | '/(auth)/register/privacy';
}

const TERMS_ITEMS: TermsItem[] = [
  { key: 'age', required: true, labelKey: 'auth.register.socialTerms.ageRequired' },
  {
    key: 'terms',
    required: true,
    labelKey: 'auth.register.socialTerms.termsRequired',
    route: '/(auth)/register/terms',
  },
  {
    key: 'privacy',
    required: true,
    labelKey: 'auth.register.socialTerms.privacy',
    route: '/(auth)/register/privacy',
  },
];

interface TermsRowProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  onPress?: () => void;
}

const TermsRow = ({ label, checked, onToggle, onPress }: TermsRowProps) => (
  <View style={styles.termsRow}>
    <Pressable
      onPress={onToggle}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={[
        styles.checkCircle,
        checked ? styles.checkCircleChecked : styles.checkCircleUnchecked,
      ]}
    >
      <Ionicons name="checkmark" size={14} color={colors.text.white} />
    </Pressable>
    <Pressable style={styles.termsRowBody} onPress={onPress} disabled={!onPress}>
      <Text style={styles.termsRowLabel}>{label}</Text>
      {onPress && <Ionicons name="chevron-forward" size={16} color={colors.gray[300]} />}
    </Pressable>
  </View>
);

const RegisterSocialTermsScreen = () => {
  const { t } = useTranslation();
  const authMethod = useRegisterStore((s) => s.authMethod);
  const signupToken = useRegisterStore((s) => s.signupToken);
  const setSocialTermsAgreed = useRegisterStore((s) => s.setSocialTermsAgreed);
  const [checked, setChecked] = useState<Record<TermsKey, boolean>>({
    age: false,
    terms: false,
    privacy: false,
  });

  const isValidEntry = authMethod === 'kakao' && !!signupToken;

  useEffect(() => {
    if (!isValidEntry) {
      router.replace('/(auth)/login');
    }
  }, [isValidEntry]);

  if (!isValidEntry) {
    return null;
  }

  const allChecked = TERMS_ITEMS.every((item) => checked[item.key]);
  const requiredChecked = TERMS_ITEMS.filter((item) => item.required).every(
    (item) => checked[item.key]
  );

  const toggleAll = () => {
    const next = !allChecked;
    setChecked({ age: next, terms: next, privacy: next });
  };

  const toggleItem = (key: TermsKey) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.container}>
      <StepHeader currentStep={2} totalStep={4} />

      <View style={styles.body}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('auth.register.socialTerms.title')}</Text>
        </View>

        <View style={styles.spacer} />

        <View style={styles.termsCard}>
          <Pressable style={styles.allAgreeRow} onPress={toggleAll}>
            <View
              style={[
                styles.checkCircle,
                allChecked ? styles.checkCircleChecked : styles.checkCircleUnchecked,
              ]}
            >
              <Ionicons name="checkmark" size={14} color={colors.text.white} />
            </View>
            <Text style={styles.allAgreeText}>{t('auth.register.socialTerms.all')}</Text>
          </Pressable>

          <View style={styles.divider} />

          <View style={styles.itemsList}>
            {TERMS_ITEMS.map((item) => (
              <TermsRow
                key={item.key}
                label={t(item.labelKey)}
                checked={checked[item.key]}
                onToggle={() => toggleItem(item.key)}
                onPress={item.route ? () => router.push(item.route!) : undefined}
              />
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label={t('common.next')}
            onPress={() => {
              setSocialTermsAgreed(requiredChecked);
              router.push('/(auth)/register/child');
            }}
            disabled={!requiredChecked}
          />
        </View>
      </View>
    </View>
  );
};

export default RegisterSocialTermsScreen;
