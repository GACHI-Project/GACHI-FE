import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { PrimaryButton } from '../../src/components/common/Button';
import Header from '../../src/components/common/Header';
import SelectionCard from '../../src/components/common/SelectionCard';
import ScanHelpModal from '../../src/components/scan/ScanHelpModal';
import ScanStepIndicator from '../../src/components/scan/ScanStepIndicator';
import colors from '../../src/constants/colors';
import fonts from '../../src/constants/fonts';
import layout from '../../src/constants/layout';

const CHILDREN = [
  { id: '1', name: '김첫째', grade: '초등학교 4학년', color: '#2CDA00' },
  { id: '2', name: '김둘째', grade: '초등학교 1학년', color: '#FFCC2F' },
];

const ScanChildSelectScreen = () => {
  const [selectedId, setSelectedId] = useState<string | null>(CHILDREN[0].id);
  const [helpVisible, setHelpVisible] = useState(false);

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
      if (!result.canceled) {
        router.push('/scan/loading');
      }
    } catch {
      // 카메라 실행 실패 시 무시
    }
  };

  const handleGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
      if (!result.canceled) {
        router.push('/scan/loading');
      }
    } catch {
      // 갤러리 실행 실패 시 무시
    }
  };

  return (
    <View style={styles.screen}>
      <Header title="문서 스캔" onHelp={() => setHelpVisible(true)} />
      <ScanStepIndicator currentStep={1} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>누구의 가정통신문인가요?</Text>
          <Text style={styles.subtitle}>아이를 선택하면 학년에 맞게 문서를 해석해드려요</Text>
        </View>

        <View style={styles.childList}>
          {CHILDREN.map((child) => (
            <SelectionCard
              key={child.id}
              name={child.name}
              label={child.grade}
              leftElement={<View style={[styles.avatar, { backgroundColor: child.color }]} />}
              selected={selectedId === child.id}
              onPress={() => setSelectedId(child.id)}
              size="md"
              indicatorColor={child.color}
            />
          ))}

          <TouchableOpacity
            style={[styles.unknownCard, selectedId === null && styles.unknownCardSelected]}
            onPress={() => setSelectedId(null)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.unknownIconWrap,
                selectedId === null && styles.unknownIconWrapSelected,
              ]}
            >
              <Ionicons name="help" size={14} color={colors.text.white} />
            </View>
            <Text style={[styles.unknownText, selectedId === null && styles.unknownTextSelected]}>
              어느 아이인지 모르겠어요
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonGroup}>
          <PrimaryButton label="카메라로 촬영하기" onPress={handleCamera} />
          <PrimaryButton label="갤러리에서 선택하기" onPress={handleGallery} />
        </View>
      </ScrollView>

      <ScanHelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
    </View>
  );
};

export default ScanChildSelectScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.text.white,
    paddingTop: 60,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: layout.screenPaddingBottom,
    gap: 24,
  },
  titleSection: {
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  childList: {
    gap: 20,
  },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 25,
  },
  unknownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary[300],
    borderRadius: 15,
    height: 90,
    gap: 10,
  },
  unknownCardSelected: {
    backgroundColor: colors.primary[0],
    borderColor: colors.primary[500],
  },
  unknownIconWrap: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  unknownIconWrapSelected: {
    backgroundColor: colors.primary[500],
  },
  unknownText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.primary[300],
  },
  unknownTextSelected: {
    color: colors.primary[500],
  },
  buttonGroup: {
    gap: 12,
  },
});
