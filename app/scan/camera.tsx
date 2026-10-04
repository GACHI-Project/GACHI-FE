import React, { useRef, useState } from 'react';
import { View, Text, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useTranslation } from 'react-i18next';
import Header from '../../src/components/common/Header';
import ScanStepIndicator from '../../src/components/scan/ScanStepIndicator';
import ScanHelpModal from '../../src/components/scan/ScanHelpModal';
import ScanChildPill from '../../src/components/scan/ScanChildPill';
import ScanCornerBrackets from '../../src/components/scan/ScanCornerBrackets';
import ScanCapturedStack from '../../src/components/scan/ScanCapturedStack';
import ScanPageReviewSheet from '../../src/components/scan/ScanPageReviewSheet';
import ScanPageDetailModal from '../../src/components/scan/ScanPageDetailModal';
import colors from '../../src/constants/colors';
import fonts from '../../src/constants/fonts';
import {
  SCAN_FRAME_W,
  SCAN_FRAME_H,
  SCAN_DEFAULT_CHILD_COLOR,
  MAX_PAGES,
  CapturedPage,
} from '../../src/constants/scan';

type ViewMode = 'camera' | 'reviewSheet' | 'pageDetail';

const ScanCameraScreen = () => {
  const { t } = useTranslation();
  const { childId, childName, childColor, childGrade } = useLocalSearchParams<{
    childId: string;
    childName: string;
    childColor: string;
    childGrade: string;
  }>();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [helpVisible, setHelpVisible] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const pageIdRef = useRef(0);
  const insets = useSafeAreaInsets();

  const [pages, setPages] = useState<CapturedPage[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('camera');
  const [detailIndex, setDetailIndex] = useState(0);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  const compressImage = async (uri: string): Promise<string> => {
    const result = await manipulateAsync(uri, [{ resize: { width: 2048 } }], {
      compress: 0.85,
      format: SaveFormat.JPEG,
    });
    return result.uri;
  };

  const handleCapture = async () => {
    if (!cameraRef.current || capturing || pages.length >= MAX_PAGES) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (photo) {
        const compressedUri = await compressImage(photo.uri);
        setCapturing(false);
        if (replaceIndex !== null) {
          const targetIndex = replaceIndex;
          setPages((prev) =>
            prev.map((page, i) => (i === targetIndex ? { ...page, uri: compressedUri } : page))
          );
          setReplaceIndex(null);
          setDetailIndex(targetIndex);
          setViewMode('pageDetail');
          return;
        }
        pageIdRef.current += 1;
        setPages((prev) => [...prev, { id: `page-${pageIdRef.current}`, uri: compressedUri }]);
        return;
      }
      setCapturing(false);
    } catch {
      Alert.alert(t('scan.camera.captureError'), t('scan.camera.captureErrorMsg'));
      setCapturing(false);
    }
  };

  const handleHeaderBack = () => {
    if (replaceIndex !== null) {
      setReplaceIndex(null);
      setViewMode('pageDetail');
      return;
    }
    router.back();
  };

  const handleReorder = (next: CapturedPage[]) => setPages(next);
  const handleDeleteFromSheet = (id: string) => setPages((prev) => prev.filter((p) => p.id !== id));
  const handlePageTap = (index: number) => {
    setDetailIndex(index);
    setViewMode('pageDetail');
  };
  const handleCompleteCapture = () => {
    router.push({
      pathname: '/scan/loading',
      params: {
        pages: JSON.stringify(pages.map((p) => p.uri)),
        childId: childId ?? '',
        childName: childName ?? '',
        childColor: childColor ?? '',
        childGrade: childGrade ?? '',
      },
    });
  };

  const handleDetailDelete = () => {
    const next = pages.filter((_, i) => i !== detailIndex);
    setPages(next);
    if (next.length === 0) {
      setViewMode('camera');
      setDetailIndex(0);
    } else {
      setDetailIndex(Math.min(detailIndex, next.length - 1));
    }
  };
  const handleDetailRetake = () => {
    setReplaceIndex(detailIndex);
    setViewMode('camera');
  };
  const handleDetailRotate = (newUri: string) => {
    setPages((prev) =>
      prev.map((page, i) => (i === detailIndex ? { ...page, uri: newUri } : page))
    );
  };

  if (!permission) return <View style={styles.screen} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Ionicons name="camera-outline" size={40} color={colors.primary[400]} />
        <Text style={styles.permissionText}>{t('scan.camera.permissionText')}</Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
          accessibilityRole="button"
        >
          <Text style={styles.permissionBtnText}>{t('scan.camera.allowPermission')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasChild = !!childName;
  const maxReached = pages.length >= MAX_PAGES;

  return (
    <View style={styles.screen}>
      <Header
        title={t('scan.title')}
        onBack={handleHeaderBack}
        onHelp={() => setHelpVisible(true)}
      />
      <ScanStepIndicator currentStep={2} />

      {hasChild && (
        <ScanChildPill
          name={childName}
          color={childColor || SCAN_DEFAULT_CHILD_COLOR}
          onChangePress={() => router.back()}
        />
      )}

      <View style={styles.cameraWrapper}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
        <ScanCornerBrackets />
        <TouchableOpacity
          style={styles.flipButton}
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          activeOpacity={0.8}
          accessibilityLabel={t('scan.camera.accessibilityFlip')}
          accessibilityRole="button"
        >
          <Ionicons name="camera-reverse-outline" size={18} color={colors.text.white} />
        </TouchableOpacity>
      </View>

      {maxReached && <Text style={styles.maxPagesText}>{t('scan.camera.maxPagesReached')}</Text>}

      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.stackSlot}>
          <ScanCapturedStack pages={pages} onPress={() => setViewMode('reviewSheet')} />
        </View>

        <View style={styles.captureRingShadow}>
          <TouchableOpacity
            style={styles.captureRing}
            onPress={handleCapture}
            disabled={capturing || maxReached}
            activeOpacity={0.85}
            accessibilityLabel={t('scan.camera.accessibilityCapture')}
            accessibilityRole="button"
          >
            <View style={[styles.captureButton, maxReached && styles.captureButtonDisabled]} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.checkButton, pages.length === 0 && styles.checkButtonDisabled]}
          onPress={() => setViewMode('reviewSheet')}
          disabled={pages.length === 0}
          activeOpacity={0.8}
          accessibilityLabel={t('scan.camera.accessibilityComplete')}
          accessibilityRole="button"
        >
          <Ionicons name="checkmark" size={24} color={colors.text.white} />
        </TouchableOpacity>
      </View>

      <ScanHelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />

      <ScanPageReviewSheet
        visible={viewMode === 'reviewSheet'}
        pages={pages}
        onReorder={handleReorder}
        onDelete={handleDeleteFromSheet}
        onPageTap={handlePageTap}
        onContinue={() => setViewMode('camera')}
        onComplete={handleCompleteCapture}
      />

      <ScanPageDetailModal
        visible={viewMode === 'pageDetail'}
        pages={pages}
        currentIndex={detailIndex}
        onIndexChange={setDetailIndex}
        onClose={() => setViewMode('camera')}
        onDelete={handleDetailDelete}
        onRetake={handleDetailRetake}
        onRotate={handleDetailRotate}
      />
    </View>
  );
};

export default ScanCameraScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.text.white,
    paddingTop: 60,
  },
  cameraWrapper: {
    flex: 1,
    maxHeight: SCAN_FRAME_H,
    width: SCAN_FRAME_W,
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  camera: {
    width: SCAN_FRAME_W,
    height: '100%',
  },
  flipButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  maxPagesText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.red,
    textAlign: 'center',
    paddingTop: 8,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 44,
    paddingTop: 12,
  },
  stackSlot: {
    width: 69,
    alignItems: 'center',
  },
  captureRingShadow: {
    shadowColor: colors.primary[400],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 6,
    borderRadius: 38,
  },
  captureRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.primary[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary[400],
  },
  captureButtonDisabled: {
    backgroundColor: colors.primary[200],
  },
  checkButton: {
    width: 51,
    height: 51,
    borderRadius: 26,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonDisabled: {
    backgroundColor: colors.primary[200],
  },
  permissionScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text.white,
  },
  permissionText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    marginTop: 12,
    color: colors.text.primary,
  },
  permissionBtn: {
    backgroundColor: colors.primary[400],
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
  },
  permissionBtnText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
  },
});
