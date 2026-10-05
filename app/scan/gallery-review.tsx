import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Header from '../../src/components/common/Header';
import ScanStepIndicator from '../../src/components/scan/ScanStepIndicator';
import ScanHelpModal from '../../src/components/scan/ScanHelpModal';
import ScanChildPill from '../../src/components/scan/ScanChildPill';
import ScanCornerBrackets from '../../src/components/scan/ScanCornerBrackets';
import ScanPageReviewSheet from '../../src/components/scan/ScanPageReviewSheet';
import ScanPageDetailModal from '../../src/components/scan/ScanPageDetailModal';
import colors from '../../src/constants/colors';
import fonts from '../../src/constants/fonts';
import layout from '../../src/constants/layout';
import {
  SCAN_FRAME_W,
  SCAN_FRAME_H,
  SCAN_DEFAULT_CHILD_COLOR,
  MAX_PAGES,
  ScanChildParams,
} from '../../src/constants/scan';
import { pickGalleryImages } from '../../src/utils/scanImage';
import { parsePagesParam, pushScanLoading } from '../../src/utils/scanNavigation';
import useScanModalFlow from '../../src/hooks/scan/useScanModalFlow';
import useScanPages from '../../src/hooks/scan/useScanPages';

type ViewMode = 'screen' | 'reviewSheet' | 'pageDetail';

const ScanGalleryReviewScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { pages: pagesParam, ...child } = useLocalSearchParams<
    ScanChildParams & { pages: string }
  >();
  const { childName, childColor } = child;

  const {
    pages,
    setPages,
    detailIndex,
    setDetailIndex,
    addPages,
    replacePage,
    removePage,
    removeDetailPage,
  } = useScanPages(parsePagesParam(pagesParam));
  const { viewMode, setViewMode, closing, runAfterModalClose, onModalClosed } =
    useScanModalFlow<ViewMode>('screen', 'reviewSheet');
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [helpVisible, setHelpVisible] = useState(false);
  const [picking, setPicking] = useState(false);

  const pickAfterModalClose = (
    limit: number,
    onPicked: (uris: string[]) => void,
    returnTo: ViewMode
  ) => {
    const accepted = runAfterModalClose(async () => {
      try {
        const result = await pickGalleryImages(limit);
        if (!mounted.current) return;
        if (result.status === 'denied') {
          Alert.alert(
            t('scan.select.error.permissionTitle'),
            t('scan.select.error.galleryPermission')
          );
        } else if (result.status === 'picked') {
          if (result.truncated) {
            Alert.alert(t('scan.galleryReview.maxPages', { max: MAX_PAGES }));
          }
          onPicked(result.uris);
        }
      } catch {
        if (!mounted.current) return;
        Alert.alert(t('scan.select.error.errorTitle'), t('scan.select.error.gallery'));
      } finally {
        if (mounted.current) {
          setPicking(false);
          setViewMode(returnTo);
        }
      }
    });
    if (accepted) setPicking(true);
  };

  const handleAddPages = () => {
    if (picking) return;
    const remaining = MAX_PAGES - pages.length;
    if (remaining <= 0) {
      Alert.alert(t('scan.galleryReview.maxPages', { max: MAX_PAGES }));
      return;
    }
    pickAfterModalClose(remaining, addPages, 'reviewSheet');
  };

  const handleReplacePage = () => {
    if (picking) return;
    const targetId = pages[detailIndex]?.id;
    if (!targetId) return;
    pickAfterModalClose(1, ([uri]) => replacePage(targetId, uri), 'pageDetail');
  };

  const handlePageTap = (index: number) => {
    setDetailIndex(index);
    setViewMode('pageDetail');
  };
  const handleDetailDelete = () => {
    const { remaining } = removeDetailPage();
    if (remaining === 0) setViewMode('reviewSheet');
  };

  const handleComplete = () => {
    if (pages.length === 0 || picking) return;
    runAfterModalClose(() =>
      pushScanLoading(
        pages.map((page) => page.uri),
        child
      )
    );
  };

  const hasChild = !!childName;
  const coverPage = pages[0];

  return (
    <View style={styles.screen}>
      <Header title={t('scan.title')} onHelp={() => setHelpVisible(true)} />
      <ScanStepIndicator currentStep={2} />

      {hasChild && (
        <ScanChildPill
          name={childName}
          color={childColor || SCAN_DEFAULT_CHILD_COLOR}
          onChangePress={() => router.back()}
        />
      )}

      <View style={styles.frameWrapper}>
        {coverPage ? (
          <Image
            source={{ uri: coverPage.uri }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel={t('scan.preview.accessibilityPreview')}
          />
        ) : (
          <View style={styles.emptyPlaceholder}>
            <Ionicons name="images-outline" size={48} color={colors.primary[400]} />
            <Text style={styles.emptyText}>{t('scan.galleryReview.empty')}</Text>
          </View>
        )}
        <ScanCornerBrackets />
        {pages.length > 0 && (
          <View style={styles.countChip}>
            <Text style={styles.countChipText}>
              {t('scan.reviewSheet.count', { count: pages.length, max: MAX_PAGES })}
            </Text>
          </View>
        )}
        {picking && (
          <View style={styles.pickingOverlay}>
            <ActivityIndicator color={colors.text.white} />
          </View>
        )}
      </View>

      <View style={[styles.buttons, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={handleAddPages}
          disabled={picking || closing}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.outlineBtnText} numberOfLines={1}>
            {t('scan.reviewSheet.gallery.continueButton')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filledBtn, pages.length === 0 && styles.filledBtnDisabled]}
          onPress={() => setViewMode('reviewSheet')}
          disabled={picking || closing || pages.length === 0}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.filledBtnText} numberOfLines={1}>
            {t('scan.galleryReview.reviewButton')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScanHelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />

      <ScanPageReviewSheet
        visible={viewMode === 'reviewSheet'}
        source="gallery"
        pages={pages}
        onReorder={setPages}
        onDelete={removePage}
        onPageTap={handlePageTap}
        onContinue={handleAddPages}
        onComplete={handleComplete}
        onClosed={onModalClosed}
        onDismiss={() => setViewMode('screen')}
      />

      <ScanPageDetailModal
        visible={viewMode === 'pageDetail'}
        source="gallery"
        pages={pages}
        currentIndex={detailIndex}
        onIndexChange={setDetailIndex}
        onClose={() => setViewMode('reviewSheet')}
        onClosed={onModalClosed}
        onDelete={handleDetailDelete}
        onRetake={handleReplacePage}
        onRotate={replacePage}
      />
    </View>
  );
};

export default ScanGalleryReviewScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.text.white,
    paddingTop: 60,
  },
  frameWrapper: {
    flex: 1,
    maxHeight: SCAN_FRAME_H,
    width: SCAN_FRAME_W,
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: SCAN_FRAME_W,
    height: '100%',
  },
  emptyPlaceholder: {
    width: SCAN_FRAME_W,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.primary[0],
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  countChip: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  countChipText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
  },
  pickingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
    gap: 12,
    paddingTop: 16,
  },
  outlineBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
  },
  outlineBtnText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text.secondary,
  },
  filledBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
  },
  filledBtnDisabled: {
    backgroundColor: colors.primary[200],
  },
  filledBtnText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.text.white,
  },
});
