import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../src/components/common/Button';
import Header from '../../src/components/common/Header';
import QueryNotice from '../../src/components/common/QueryNotice';
import SelectionCard from '../../src/components/common/SelectionCard';
import ScanHelpModal from '../../src/components/scan/ScanHelpModal';
import ScanStepIndicator from '../../src/components/scan/ScanStepIndicator';
import colors from '../../src/constants/colors';
import fonts from '../../src/constants/fonts';
import layout from '../../src/constants/layout';
import { MAX_PAGES } from '../../src/constants/scan';
import { useChildrenQuery } from '../../src/query/resources';
import { hasBlockingQueryError } from '../../src/query/state';
import { pickGalleryImages } from '../../src/utils/scanImage';

const ScanChildSelectScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const childrenQuery = useChildrenQuery();
  const children = useMemo(() => childrenQuery.data ?? [], [childrenQuery.data]);
  const [selectedId, setSelectedId] = useState<number | null | undefined>(undefined);
  const [helpVisible, setHelpVisible] = useState(false);
  const loading = childrenQuery.isLoading;
  const childrenError = hasBlockingQueryError(childrenQuery);
  const blocked = childrenError || childrenQuery.data === undefined;
  const unassigned = selectedId === null || selectedId === undefined;
  const [pickingGallery, setPickingGallery] = useState(false);

  useEffect(() => {
    if (childrenQuery.data === undefined) return;
    setSelectedId((current) =>
      current === null || children.some((child) => child.id === current) ? current : children[0]?.id
    );
  }, [children, childrenQuery.data]);

  const selected = children.find((c) => c.id === selectedId);
  const childParams = {
    childId: selected ? String(selected.id) : '',
    childName: selected?.name ?? '',
    childColor: selected?.colorCode ?? '',
    childGrade: selected ? t('common.elementaryGrade', { grade: selected.grade }) : '',
  };

  const handleCamera = () => {
    if (blocked) return;
    router.push({ pathname: '/scan/camera', params: childParams });
  };

  const handlePdf = async () => {
    if (blocked) return;
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
    if (pickingGallery || blocked) return;
    setPickingGallery(true);
    try {
      const result = await pickGalleryImages(MAX_PAGES);
      if (result.status === 'denied') {
        Alert.alert(
          t('scan.select.error.permissionTitle'),
          t('scan.select.error.galleryPermission')
        );
        return;
      }
      if (result.status === 'canceled') return;
      if (result.truncated) {
        Alert.alert(t('scan.galleryReview.maxPages', { max: MAX_PAGES }));
      }
      router.push({
        pathname: '/scan/gallery-review',
        params: { pages: JSON.stringify(result.uris), ...childParams },
      });
    } catch {
      Alert.alert(t('scan.select.error.errorTitle'), t('scan.select.error.gallery'));
    } finally {
      setPickingGallery(false);
    }
  };

  const renderChildren = () => {
    if (childrenError)
      return (
        <QueryNotice
          onRetry={() => {
            void childrenQuery.refetch();
          }}
          retrying={childrenQuery.isFetching}
        />
      );
    if (childrenQuery.fetchStatus === 'paused' && !childrenQuery.data)
      return <QueryNotice loading message={t('common.waitingConnection')} />;
    if (loading) return <ActivityIndicator color={colors.primary[400]} />;
    return children.map((child) => (
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
    ));
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
          {renderChildren()}
          {childrenQuery.error && !childrenError && (
            <QueryNotice
              message={t('common.refreshFailed')}
              onRetry={() => {
                void childrenQuery.refetch();
              }}
            />
          )}

          <TouchableOpacity
            style={[styles.unknownCard, unassigned && styles.unknownCardSelected]}
            onPress={() => setSelectedId(null)}
            disabled={blocked}
            activeOpacity={0.8}
            accessibilityLabel={t('scan.select.unknown')}
            accessibilityRole="button"
          >
            <View style={[styles.unknownIconWrap, unassigned && styles.unknownIconWrapSelected]}>
              <Ionicons name="help" size={14} color={colors.text.white} />
            </View>
            <Text style={[styles.unknownText, unassigned && styles.unknownTextSelected]}>
              {t('scan.select.unknown')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonGroup}>
          <PrimaryButton
            label={t('scan.select.camera')}
            onPress={handleCamera}
            disabled={blocked}
          />
          <PrimaryButton
            label={t('scan.select.gallery')}
            onPress={handleGallery}
            disabled={pickingGallery || blocked}
          />
          <PrimaryButton label={t('scan.select.pdf')} onPress={handlePdf} disabled={blocked} />
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
