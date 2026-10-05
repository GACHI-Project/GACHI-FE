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
  CapturedPage,
} from '../../src/constants/scan';
import { pickGalleryImages } from '../../src/utils/scanImage';
import useScanModalFlow from '../../src/hooks/scan/useScanModalFlow';

type ViewMode = 'screen' | 'reviewSheet' | 'pageDetail';

const ScanGalleryReviewScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    pages: pagesParam,
    childId,
    childName,
    childColor,
    childGrade,
  } = useLocalSearchParams<{
    pages: string;
    childId: string;
    childName: string;
    childColor: string;
    childGrade: string;
  }>();

  const pageIdRef = useRef(0);
  const createPage = (uri: string): CapturedPage => {
    pageIdRef.current += 1;
    return { id: `page-${pageIdRef.current}`, uri };
  };

  const [pages, setPages] = useState<CapturedPage[]>(() => {
    try {
      return (JSON.parse(pagesParam ?? '[]') as string[]).map(createPage);
    } catch {
      return [];
    }
  });
  const { viewMode, setViewMode, closing, runAfterModalClose, onModalClosed } =
    useScanModalFlow<ViewMode>('screen', 'reviewSheet');
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [detailIndex, setDetailIndex] = useState(0);
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
    pickAfterModalClose(
      remaining,
      (uris) => setPages((prev) => [...prev, ...uris.map(createPage)]),
      'reviewSheet'
    );
  };

  const handleReplacePage = () => {
    if (picking) return;
    const targetId = pages[detailIndex]?.id;
    if (!targetId) return;
    pickAfterModalClose(
      1,
      ([uri]) =>
        setPages((prev) => prev.map((page) => (page.id === targetId ? { ...page, uri } : page))),
      'pageDetail'
    );
  };

  const handleDeleteFromSheet = (id: string) => setPages((prev) => prev.filter((p) => p.id !== id));
  const handlePageTap = (index: number) => {
    setDetailIndex(index);
    setViewMode('pageDetail');
  };
  const handleDetailDelete = () => {
    const next = pages.filter((_, i) => i !== detailIndex);
    setPages(next);
    if (next.length === 0) {
      setViewMode('reviewSheet');
      setDetailIndex(0);
    } else {
      setDetailIndex(Math.min(detailIndex, next.length - 1));
    }
  };
  const handleDetailRotate = (pageId: string, newUri: string) => {
    setPages((prev) => prev.map((page) => (page.id === pageId ? { ...page, uri: newUri } : page)));
  };

  const handleComplete = () => {
    if (pages.length === 0 || picking) return;
    runAfterModalClose(() =>
      router.push({
        pathname: '/scan/loading',
        params: {
          pages: JSON.stringify(pages.map((p) => p.uri)),
          childId: childId ?? '',
          childName: childName ?? '',
          childColor: childColor ?? '',
          childGrade: childGrade ?? '',
        },
      })
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
        onDelete={handleDeleteFromSheet}
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
        onRotate={handleDetailRotate}
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
