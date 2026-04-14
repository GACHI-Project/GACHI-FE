import { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import StepHeader from '../../../src/components/common/StepHeader';
import { PrimaryButton, SecondaryButton } from '../../../src/components/common/Button';
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

// ─── LanguageCard ─────────────────────────────────────────────────────────────

interface LanguageCardProps {
  option: LanguageOption;
  selected: boolean;
  onPress: () => void;
}

const LanguageCard = ({ option, selected, onPress }: LanguageCardProps) => (
  <TouchableOpacity
    style={[styles.card, selected && styles.cardSelected]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    {selected && <View style={styles.selectedBar} />}
    <View style={styles.flagWrapper}>
      <Image source={option.flag} style={styles.flagImage} />
    </View>

    <View style={styles.cardContent}>
      <Text style={styles.cardName}>{option.name}</Text>
      <Text style={styles.cardLabel}>{option.label}</Text>
    </View>

    <View style={[styles.radio, selected && styles.radioSelected]} />
  </TouchableOpacity>
);

// ─── 메인 화면 ────────────────────────────────────────────────────────────────

const RegisterLanguageScreen = () => {
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
        {/* 타이틀 */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>사용할 언어를 선택해 주세요</Text>
          <Text style={styles.subtitle}>선택한 언어로 가정통신문을 번역하고 쉽게 설명해드려요</Text>
        </View>

        {/* 언어 선택 */}
        {LANGUAGE_OPTIONS.map((option) => (
          <LanguageCard
            key={option.type}
            option={option}
            selected={selected === option.type}
            onPress={() => setSelected(option.type)}
          />
        ))}

        {/* 안내 배너 + 버튼 */}
        <View style={styles.footer}>
          <View style={styles.banner}>
            <Ionicons name="settings" size={18} color={colors.text.primary} />
            <Text style={styles.bannerText}>언어는 설정에서 언제든 변경할 수 있어요</Text>
          </View>
          <PrimaryButton label="다음으로 →" onPress={() => router.push('/(auth)/register/basic')} />
          <SecondaryButton
            label="나중에 설정할게요"
            onPress={() => router.push('/(auth)/register/basic')}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default RegisterLanguageScreen;
