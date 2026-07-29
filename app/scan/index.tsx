import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../src/components/common/Button';
import Header from '../../src/components/common/Header';
import SelectionCard from '../../src/components/common/SelectionCard';
import ScanHelpModal from '../../src/components/scan/ScanHelpModal';
import ScanStepIndicator from '../../src/components/scan/ScanStepIndicator';
import { getMyChildren, ChildResult } from '../../src/api/child';
import colors from '../../src/constants/colors';
import fonts from '../../src/constants/fonts';
import layout from '../../src/constants/layout';

const ScanChildSelectScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [children, setChildren] = useState<ChildResult[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyChildren()
      .then((result) => {
        setChildren(result);
        if (result.length > 0) setSelectedId(result[0].id);
      })
      .catch(() =>
        Alert.alert(t('scan.select.error.errorTitle'), t('scan.select.error.loadChildren'))
      )
      .finally(() => setLoading(false));
  }, [t]);

  const selected = children.find((c) => c.id === selectedId);
  const childParams = {
    childId: String(selectedId ?? ''),
    childName: selected?.name ?? '',
    childColor: selected?.colorCode ?? '',
    childGrade: selected ? t('common.elementaryGrade', { grade: selected.grade }) : '',
  };

  const handleCamera = () => {
    router.push({ pathname: '/scan/camera', params: childParams });
  };

  const handlePdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled) {
        router.push({
          pathname: '/scan/preview',
          params: {
            photoUri: result.assets[0].uri,
            ...childParams,
            source: 'pdf',
            fileType: result.assets[0].mimeType ?? 'application/pdf',
          },
        });
      }
    } catch {
      Alert.alert(t('scan.select.error.errorTitle'), t('scan.select.error.pdf'));
    }
  };

  const handleGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('scan.select.error.permissionTitle'),
          t('scan.select.error.galleryPermission')
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
      if (!result.canceled) {
        const compressed = await manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 2048 } }],
          { compress: 0.85, format: SaveFormat.JPEG }
        );
        router.push({
          pathname: '/scan/preview',
          params: { photoUri: compressed.uri, ...childParams, source: 'gallery' },
        });
      }
    } catch {
      Alert.alert(t('scan.select.error.errorTitle'), t('scan.select.error.gallery'));
    }
  };

  return (
    <View style={styles.screen}>
      <Header title={t('scan.title')} onHelp={() => setHelpVisible(true)} />
      <ScanStepIndicator currentStep={1} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + layout.screenPaddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('scan.select.title')}</Text>
          <Text style={styles.subtitle}>{t('scan.select.subtitle')}</Text>
        </View>

        <View style={styles.childList}>
          {loading ? (
            <ActivityIndicator color={colors.primary[400]} />
          ) : (
            children.map((child) => (
              <SelectionCard
                key={child.id}
                name={child.name}
                label={t('common.elementaryGrade', { grade: child.grade })}
                leftElement={<View style={[styles.avatar, { backgroundColor: child.colorCode }]} />}
                selected={selectedId === child.id}
                onPress={() => setSelectedId(child.id)}
                size="md"
                indicatorColor={child.colorCode}
              />
            ))
          )}

          <TouchableOpacity
            style={[styles.unknownCard, selectedId === null && styles.unknownCardSelected]}
            onPress={() => setSelectedId(null)}
            activeOpacity={0.8}
            accessibilityLabel={t('scan.select.unknown')}
            accessibilityRole="button"
          >
            <View
              style={[
                styles.unknownIconWrap,
                selectedId === null && styles.unknownIconWrapSelected,
              ]}
            >
              <Ionicons name="help" size={14} color={colors.text.white} />
            </View>
            <Text
              style={[styles.unknownText, selectedId === null && styles.unknownTextSelected]}
              numberOfLines={1}
            >
              {t('scan.select.unknown')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonGroup}>
          <PrimaryButton label={t('scan.select.camera')} onPress={handleCamera} />
          <PrimaryButton label={t('scan.select.gallery')} onPress={handleGallery} />
          <PrimaryButton label={t('scan.select.pdf')} onPress={handlePdf} />
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
    minHeight: 90,
    paddingVertical: 16,
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
    flexShrink: 1,
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
