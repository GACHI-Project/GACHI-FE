import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  AppState,
  Linking,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useIsFocused, usePreventRemove } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  ScanChildParams,
} from '../../src/constants/scan';
import { compressScanImage } from '../../src/utils/scanImage';
import { pushScanLoading } from '../../src/utils/scanNavigation';
import useScanModalFlow from '../../src/hooks/scan/useScanModalFlow';
import useScanPages from '../../src/hooks/scan/useScanPages';

type ViewMode = 'camera' | 'reviewSheet' | 'pageDetail';

const ScanCameraScreen = () => {
  const { t } = useTranslation();
  const child = useLocalSearchParams<ScanChildParams>();
  const { childName, childColor } = child;
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [helpVisible, setHelpVisible] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [appState, setAppState] = useState(AppState.currentState);
  const focused = useIsFocused();
  const cameraRef = useRef<CameraView>(null);
  const readyRef = useRef(false);
  const captureLock = useRef(false);
  const captureGeneration = useRef(0);
  const mounted = useRef(true);
  const insets = useSafeAreaInsets();

  const {
    pages,
    setPages,
    detailIndex,
    setDetailIndex,
    addPages,
    replacePage,
    removePage,
    removeDetailPage,
  } = useScanPages();
  const { viewMode, setViewMode, closing, runAfterModalClose, onModalClosed } =
    useScanModalFlow<ViewMode>('camera', 'camera');
  const [replacePageId, setReplacePageId] = useState<string | null>(null);
  const busy = capturing || closing;
  const cameraVisible =
    focused &&
    appState === 'active' &&
    !!permission?.granted &&
    viewMode === 'camera' &&
    !closing &&
    !helpVisible;

  const resetReady = useCallback(() => {
    readyRef.current = false;
    setCameraReady(false);
  }, []);

  const invalidateCapture = useCallback(() => {
    captureGeneration.current += 1;
    captureLock.current = false;
    resetReady();
    setCapturing(false);
  }, [resetReady]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      captureGeneration.current += 1;
      captureLock.current = false;
    };
  }, []);

  useEffect(() => {
    if (!focused) invalidateCapture();
    else void getPermission().catch(() => {});
  }, [focused, getPermission, invalidateCapture]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') invalidateCapture();
      else if (focused) void getPermission().catch(() => {});
      setAppState(next);
    });
    return () => subscription.remove();
  }, [focused, getPermission, invalidateCapture]);

  useEffect(() => {
    if (!cameraVisible) resetReady();
  }, [cameraVisible, resetReady]);

  const cancelRetake = () => {
    const targetIndex = pages.findIndex((page) => page.id === replacePageId);
    setReplacePageId(null);
    if (targetIndex >= 0) {
      setDetailIndex(targetIndex);
      setViewMode('pageDetail');
    }
  };

  usePreventRemove(busy || replacePageId !== null, () => {
    if (!captureLock.current && !closing && replacePageId !== null) cancelRetake();
  });

  const handleCapture = async () => {
    if (!cameraRef.current || !readyRef.current || !cameraVisible || captureLock.current || closing)
      return;
    if (replacePageId === null && pages.length >= MAX_PAGES) return;
    const targetId = replacePageId;
    const targetIndex = pages.findIndex((page) => page.id === targetId);
    if (targetId !== null && targetIndex < 0) {
      setReplacePageId(null);
      return;
    }
    captureLock.current = true;
    setCapturing(true);
    const generation = captureGeneration.current;
    const isCurrent = () => mounted.current && generation === captureGeneration.current;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (!isCurrent() || !photo) return;
      const compressedUri = await compressScanImage(photo.uri);
      if (!isCurrent()) return;
      if (targetId !== null) {
        replacePage(targetId, compressedUri);
        setReplacePageId(null);
        setDetailIndex(targetIndex);
        setViewMode('pageDetail');
      } else {
        addPages([compressedUri]);
      }
    } catch {
      if (isCurrent()) Alert.alert(t('scan.camera.captureError'), t('scan.camera.captureErrorMsg'));
    } finally {
      if (isCurrent()) {
        captureLock.current = false;
        setCapturing(false);
      }
    }
  };

  const handleHeaderBack = () => {
    if (captureLock.current || closing) return;
    if (replacePageId !== null) cancelRetake();
    else router.back();
  };
  const handleOpenReview = () => {
    if (captureLock.current || closing) return;
    setViewMode('reviewSheet');
  };
  const handleReorder = (next: CapturedPage[]) => {
    if (!captureLock.current) setPages(next);
  };
  const handleDeleteFromSheet = (id: string) => {
    if (captureLock.current) return;
    removePage(id);
    if (replacePageId === id) setReplacePageId(null);
  };
  const handlePageTap = (index: number) => {
    if (captureLock.current || closing) return;
    setDetailIndex(index);
    setViewMode('pageDetail');
  };
  const handleCompleteCapture = () => {
    if (captureLock.current || closing || pages.length === 0) return;
    runAfterModalClose(() => {
      setReplacePageId(null);
      pushScanLoading(
        pages.map((page) => page.uri),
        child
      );
    });
  };

  const handleDetailDelete = () => {
    const { removedId, remaining } = removeDetailPage();
    if (removedId === replacePageId) setReplacePageId(null);
    if (remaining === 0) setViewMode('camera');
  };
  const handleDetailRetake = () => {
    const target = pages[detailIndex];
    if (!target) return;
    setReplacePageId(target.id);
    setViewMode('camera');
  };

  const handlePermission = async () => {
    if (permissionBusy) return;
    setPermissionBusy(true);
    try {
      if (permission?.canAskAgain === false) await Linking.openSettings();
      else await requestPermission();
    } catch {
      if (mounted.current)
        Alert.alert(t('scan.camera.errorTitle'), t('scan.camera.permissionError'));
    } finally {
      if (mounted.current) setPermissionBusy(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.screen}>
        <Header title={t('scan.title')} onBack={handleHeaderBack} />
        <View style={styles.permissionScreen}>
          {!permission ? (
            <ActivityIndicator color={colors.primary[400]} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={40} color={colors.primary[400]} />
              <Text style={styles.permissionText}>
                {t(
                  permission.canAskAgain
                    ? 'scan.camera.permissionText'
                    : 'scan.camera.permissionSettings'
                )}
              </Text>
              <TouchableOpacity
                style={styles.permissionBtn}
                onPress={handlePermission}
                disabled={permissionBusy}
                accessibilityRole="button"
              >
                {permissionBusy ? (
                  <ActivityIndicator color={colors.text.white} />
                ) : (
                  <Text style={styles.permissionBtnText}>
                    {t(
                      permission.canAskAgain
                        ? 'scan.camera.allowPermission'
                        : 'scan.camera.openSettings'
                    )}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  const hasChild = !!childName;
  const maxReached = replacePageId === null && pages.length >= MAX_PAGES;
  const captureDisabled = busy || maxReached || !cameraReady || !cameraVisible || cameraError;
  const replacementNumber = pages.findIndex((page) => page.id === replacePageId) + 1;

  return (
    <View style={styles.screen}>
      <Header
        title={t('scan.title')}
        onBack={handleHeaderBack}
        disabled={busy}
        onHelp={() => {
          if (!captureLock.current && !closing) setHelpVisible(true);
        }}
      />
      <ScanStepIndicator currentStep={2} />
      {hasChild && (
        <ScanChildPill
          name={childName}
          color={childColor || SCAN_DEFAULT_CHILD_COLOR}
          onChangePress={
            busy || replacePageId !== null
              ? undefined
              : () => {
                  if (!captureLock.current && !closing) router.back();
                }
          }
        />
      )}
      <View style={styles.cameraWrapper}>
        {cameraVisible && !cameraError && (
          <CameraView
            key={facing}
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            onCameraReady={() => {
              readyRef.current = true;
              setCameraReady(true);
            }}
            onMountError={() => {
              resetReady();
              setCameraError(true);
              invalidateCapture();
            }}
          />
        )}
        <ScanCornerBrackets />
        {cameraError ? (
          <View style={styles.cameraStatus}>
            <Text style={styles.statusText}>{t('scan.camera.unavailable')}</Text>
            <TouchableOpacity
              style={styles.permissionBtn}
              accessibilityRole="button"
              onPress={() => {
                resetReady();
                setCameraError(false);
              }}
            >
              <Text style={styles.permissionBtnText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          (capturing || (cameraVisible && !cameraReady)) && (
            <View style={styles.cameraStatus} pointerEvents="none">
              <ActivityIndicator color={colors.primary[400]} />
              <Text style={styles.statusText}>
                {t(capturing ? 'scan.camera.processing' : 'common.preparing')}
              </Text>
            </View>
          )
        )}
        <TouchableOpacity
          style={styles.flipButton}
          onPress={() => {
            if (captureLock.current || closing) return;
            resetReady();
            setCameraError(false);
            setFacing((value) => (value === 'back' ? 'front' : 'back'));
          }}
          disabled={busy}
          activeOpacity={0.8}
          accessibilityLabel={t('scan.camera.accessibilityFlip')}
          accessibilityRole="button"
        >
          <Ionicons name="camera-reverse-outline" size={18} color={colors.text.white} />
        </TouchableOpacity>
      </View>
      {replacementNumber > 0 && (
        <Text style={styles.statusText}>
          {t('scan.camera.retakingPage', { number: replacementNumber })}
        </Text>
      )}
      {maxReached && <Text style={styles.maxPagesText}>{t('scan.camera.maxPagesReached')}</Text>}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.stackSlot}>
          <ScanCapturedStack pages={pages} onPress={handleOpenReview} disabled={busy} />
        </View>
        <View style={styles.captureRingShadow}>
          <TouchableOpacity
            style={styles.captureRing}
            onPress={handleCapture}
            disabled={captureDisabled}
            activeOpacity={0.85}
            accessibilityLabel={t('scan.camera.accessibilityCapture')}
            accessibilityRole="button"
          >
            <View style={[styles.captureButton, captureDisabled && styles.captureButtonDisabled]} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.checkButton, (busy || pages.length === 0) && styles.checkButtonDisabled]}
          onPress={handleOpenReview}
          disabled={busy || pages.length === 0}
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
        onClosed={onModalClosed}
      />
      <ScanPageDetailModal
        visible={viewMode === 'pageDetail'}
        pages={pages}
        currentIndex={detailIndex}
        onIndexChange={setDetailIndex}
        onClose={() => setViewMode('camera')}
        onClosed={onModalClosed}
        onDelete={handleDetailDelete}
        onRetake={handleDetailRetake}
        onRotate={replacePage}
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
  cameraStatus: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
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
    textAlign: 'center',
    paddingHorizontal: 24,
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
