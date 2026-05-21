import { useState } from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import StepHeader from '../../../src/components/common/StepHeader';
import { PrimaryButton, SecondaryButton } from '../../../src/components/common/Button';
import SelectionCard from '../../../src/components/common/SelectionCard';
import colors from '../../../src/constants/colors';
import styles from '../../../src/styles/register/language';
import { LanguageType, LanguageOption } from '../../../src/types/language';
import KRFlag from '../../../assets/flags/KR.png';
import USFlag from '../../../assets/flags/US.png';
import VNFlag from '../../../assets/flags/VN.png';
import CNFlag from '../../../assets/flags/CN.png';

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { type: 'ko', name: '한국어', label: 'Korean', flag: KRFlag },
  { type: 'en', name: 'English', label: '영어', flag: USFlag },
  { type: 'vi', name: 'Tiếng Việt', label: '베트남어', flag: VNFlag },
  { type: 'zh', name: '中文', label: '중국어', flag: CNFlag },
];

const RegisterLanguageScreen = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<LanguageType>('ko');

  return (
    <View style={styles.container}>
      <StepHeader currentStep={1} totalStep={4} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('auth.register.language.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.register.language.subtitle')}</Text>
        </View>

        <View style={styles.cardList}>
          {LANGUAGE_OPTIONS.map((option) => (
            <SelectionCard
              key={option.type}
              name={option.name}
              label={option.label}
              leftElement={
                <View style={styles.flagWrapper}>
                  <Image source={option.flag} style={styles.flagImage} />
                </View>
              }
              selected={selected === option.type}
              onPress={() => setSelected(option.type)}
              size="lg"
            />
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.banner}>
            <Ionicons name="settings" size={18} color={colors.text.primary} />
            <Text style={styles.bannerText}>{t('auth.register.language.settingsTip')}</Text>
          </View>
          <PrimaryButton label={t('common.next')} onPress={() => router.push('/(auth)/register/basic')} />
          <SecondaryButton
            label={t('common.later')}
            onPress={() => router.push('/(auth)/register/basic')}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default RegisterLanguageScreen;
