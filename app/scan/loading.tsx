import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  Text,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Header from '../../src/components/common/Header';
import ScanHelpModal from '../../src/components/scan/ScanHelpModal';
import ScanStepIndicator from '../../src/components/scan/ScanStepIndicator';
import {
  uploadNewsletter,
  getNewsletterStatus,
  resumeNewsletter,
  skipNewsletterPage,
  NewsletterApiError,
  NewsletterStatus,
  NewsletterStatusResult,
} from '../../src/api/newsletter';
import { getPausedTitle, getPausedDescription } from '../../src/utils/newsletterPaused';
import { SCAN_FRAME_H } from '../../src/constants/scan';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/scan/loading';

const ScanLoadingScreen = () => {
  const { photoUri, pages, childId, childName, childColor, childGrade } = useLocalSearchParams<{
    photoUri?: string;
    pages?: string;
    childId: string;
    childName: string;
    childColor: string;
    childGrade: string;
  }>();
  let photoUris: string[] = [];
  if (pages) {
    photoUris = JSON.parse(pages) as string[];
  } else if (photoUri) {
    photoUris = [photoUri];
  }
  const displayUri = photoUris[0];

  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const scanLine = useRef(new Animated.Value(0)).current;

  const frameOpacity = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(20)).current;
  const nextBtnOpacity = useRef(new Animated.Value(0)).current;
  const nextBtnSlide = useRef(new Animated.Value(30)).current;

  const glowAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const completionAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const { t } = useTranslation();
  const [displayPercent, setDisplayPercent] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<NewsletterStatus>('PENDING');
  const [isComplete, setIsComplete] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [newsletterId, setNewsletterId] = useState<number | null>(null);
  const [pageProgress, setPageProgress] = useState<{ total?: number; processed?: number }>({});
  const [pausedInfo, setPausedInfo] = useState<NewsletterStatusResult | null>(null);
  const [actionLoading, setActionLoading] = useState<'retry' | 'skip' | null>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPollingRef = useRef<((id: number) => void) | undefined>(undefined);

  useEffect(() => {
    if (pausedInfo) {
      scanLine.stopAnimation();
      return undefined;
    }

    const loopScanLine = () => {
      scanLine.setValue(0);
      Animated.timing(scanLine, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) loopScanLine();
      });
    };
    loopScanLine();

    return () => {
      scanLine.stopAnimation();
    };
  }, [scanLine, pausedInfo]);

  useEffect(() => {
    if (photoUris.length === 0) return () => {};
    let cancelled = false;

    const poll = async (id: number) => {
      if (cancelled) return;
      try {
        const result = await getNewsletterStatus(id);
        if (cancelled) return;

        setDisplayPercent(result.progressPercent);
        setAnalysisStatus(result.status);
        setPageProgress({ total: result.totalPages, processed: result.processedPages });
        Animated.timing(progress, {
          toValue: result.progressPercent / 100,
          duration: 400,
          useNativeDriver: false,
        }).start();

        if (result.status === 'COMPLETED') {
          setPausedInfo(null);
          setIsComplete(true);
          return;
        }
        if (result.status === 'FAILED') {
          Alert.alert(
            t('scan.loading.error.analysisFailed'),
            t('scan.loading.error.analysisFailedMsg'),
            [{ text: t('common.confirm'), onPress: () => router.back() }]
          );
          return;
        }
        if (result.status === 'PAUSED') {
          setPausedInfo(result);
          return;
        }
        setPausedInfo(null);
      } catch {
        // 폴링 중 네트워크 오류는 무시하고 계속 시도
      }
      pollingRef.current = setTimeout(() => poll(id), 2000);
    };

    const startPolling = (id: number) => {
      pollingRef.current = setTimeout(() => poll(id), 2000);
    };
    startPollingRef.current = startPolling;

    const parsedChildId = childId ? Number(childId) : undefined;
    uploadNewsletter(photoUris, parsedChildId)
      .then((result) => {
        if (cancelled) return;
        setNewsletterId(result.newsletterId);
        startPolling(result.newsletterId);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        let message = t('scan.loading.error.uploadDefault');
        if (error instanceof NewsletterApiError) {
          if (error.code === 'NL4091') message = t('scan.loading.error.duplicate');
          else if (error.code === 'NL4002') message = t('scan.loading.error.unsupportedFormat');
          else if (error.code === 'NL4003') message = t('scan.loading.error.fileTooLarge');
        }
        Alert.alert(t('scan.loading.error.uploadFailed'), message, [
          { text: t('common.confirm'), onPress: () => router.back() },
        ]);
      });

    return () => {
      cancelled = true;
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isComplete) return () => {};

    completionAnimation.current = Animated.parallel([
      Animated.timing(frameOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(checkmarkScale, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(550),
        Animated.parallel([
          Animated.timing(textOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.spring(textSlide, {
            toValue: 0,
            tension: 60,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(900),
        Animated.parallel([
          Animated.timing(nextBtnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(nextBtnSlide, {
            toValue: 0,
            tension: 55,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    completionAnimation.current.start(() => {
      glowAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, { toValue: 1.12, duration: 950, useNativeDriver: true }),
          Animated.timing(glowPulse, { toValue: 1.0, duration: 950, useNativeDriver: true }),
        ])
      );
      glowAnimation.current.start();
    });

    return () => {
      completionAnimation.current?.stop();
      glowAnimation.current?.stop();
    };
  }, [
    isComplete,
    frameOpacity,
    checkmarkScale,
    glowPulse,
    textOpacity,
    textSlide,
    nextBtnOpacity,
    nextBtnSlide,
  ]);

  const handleActionError = useCallback(() => {
    Alert.alert(t('scan.loading.error.analysisFailed'), t('scan.loading.error.analysisFailedMsg'));
  }, [t]);

  const applyResumeResult = useCallback(
    async (id: number, result: { status: NewsletterStatus }) => {
      if (result.status === 'PAUSED') {
        const fresh = await getNewsletterStatus(id);
        setPausedInfo(fresh);
        setDisplayPercent(fresh.progressPercent);
        setAnalysisStatus(fresh.status);
        return;
      }
      setPausedInfo(null);
      setAnalysisStatus(result.status);
      startPollingRef.current?.(id);
    },
    []
  );

  const handleRetry = async () => {
    if (!newsletterId || actionLoading) return;
    setActionLoading('retry');
    try {
      const result = await resumeNewsletter(newsletterId);
      await applyResumeResult(newsletterId, result);
    } catch {
      handleActionError();
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkip = async () => {
    if (!newsletterId || !pausedInfo?.pausedPageNo || actionLoading) return;
    setActionLoading('skip');
    try {
      const result = await skipNewsletterPage(newsletterId, pausedInfo.pausedPageNo);
      await applyResumeResult(newsletterId, result);
    } catch {
      handleActionError();
    } finally {
      setActionLoading(null);
    }
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const scanLineY = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_FRAME_H],
  });

  const showPageCount =
    !pausedInfo &&
    analysisStatus === 'PROCESSING' &&
    (pageProgress.total ?? 0) > 1 &&
    pageProgress.total !== undefined;
  const pageNo = showPageCount
    ? Math.min((pageProgress.processed ?? 0) + 1, pageProgress.total!)
    : 0;

  let statusTitle: string;
  if (isComplete) {
    statusTitle = t('scan.loading.complete');
  } else if (pausedInfo) {
    statusTitle = getPausedTitle(pausedInfo, t);
  } else if (showPageCount) {
    statusTitle = t('scan.loading.analyzingWithPage', { n: pageNo, total: pageProgress.total });
  } else {
    statusTitle = t(`scan.loading.${analysisStatus === 'PROCESSING' ? 'analyzing' : 'preparing'}`);
  }

  const pausedDescription = pausedInfo ? getPausedDescription(pausedInfo, t) : '';
  const showRetry = !!pausedInfo?.retryable;
  const showSkip = !!pausedInfo?.skippable;

  let statusIcon: React.ReactNode;
  if (isComplete) {
    statusIcon = (
      <View style={styles.doneIcon}>
        <Ionicons name="checkmark" size={22} color={colors.text.white} />
      </View>
    );
  } else if (pausedInfo) {
    statusIcon = (
      <View style={styles.pausedIcon}>
        <Ionicons name="warning" size={28} color={colors.secondary[500]} />
      </View>
    );
  } else {
    statusIcon = <ActivityIndicator size="large" color={colors.primary[400]} />;
  }

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <Header title={t('scan.title')} onHelp={() => setHelpVisible(true)} />
      <ScanStepIndicator currentStep={isComplete ? 4 : 3} />

      {isComplete ? (
        <Animated.View style={[styles.completionFrame, { opacity: frameOpacity }]}>
          <Animated.View style={{ transform: [{ scale: glowPulse }] }}>
            <Animated.View style={[styles.glowCircle, { transform: [{ scale: checkmarkScale }] }]}>
              <Ionicons name="checkmark" size={44} color={colors.text.white} />
            </Animated.View>
          </Animated.View>
          <Animated.Text
            style={[
              styles.completionText,
              { opacity: textOpacity, transform: [{ translateY: textSlide }] },
            ]}
          >
            {t('scan.loading.scanComplete')}
          </Animated.Text>
        </Animated.View>
      ) : (
        <View style={styles.imageWrapper}>
          {displayUri ? (
            <Image source={{ uri: displayUri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
          <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]} />
        </View>
      )}

      <View style={styles.statusArea}>
        <View style={styles.statusRow}>
          {statusIcon}
          <View style={styles.statusTexts}>
            <Text style={styles.statusTitle} numberOfLines={pausedInfo || showPageCount ? 2 : 1}>
              {statusTitle}
            </Text>
            {!isComplete && (
              <Text style={styles.statusSubtitle} numberOfLines={2}>
                {pausedInfo ? pausedDescription : t('scan.loading.analyzing')}
              </Text>
            )}
          </View>
          {pausedInfo ? (
            <Text style={styles.pausedPageText} allowFontScaling={false}>
              {pausedInfo.pausedPageNo}/{pausedInfo.totalPages}
            </Text>
          ) : (
            <Text style={styles.percentText} allowFontScaling={false}>
              {displayPercent}%
            </Text>
          )}
        </View>

        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: progressWidth },
              pausedInfo && styles.progressFillPaused,
            ]}
          />
        </View>
      </View>

      {isComplete && (
        <Animated.View
          style={[
            styles.nextBtnWrapper,
            {
              opacity: nextBtnOpacity,
              transform: [{ translateY: nextBtnSlide }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.nextBtn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('scan.loading.accessibilityNext')}
            onPress={() =>
              router.push({
                pathname: '/scan/result',
                params: {
                  photoUri: displayUri,
                  childName,
                  childColor,
                  childGrade,
                  newsletterId: String(newsletterId),
                },
              })
            }
          >
            <Text style={styles.nextBtnText}>{t('scan.loading.next')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {pausedInfo && (showRetry || showSkip) && (
        <View style={styles.pausedButtonRow}>
          {showSkip && (
            <TouchableOpacity
              style={[
                styles.pausedButton,
                showRetry ? styles.pausedButtonOutline : styles.pausedButtonFilled,
                actionLoading && styles.pausedButtonDisabled,
              ]}
              onPress={handleSkip}
              disabled={!!actionLoading}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('scan.loading.paused.accessibilitySkip')}
            >
              {actionLoading === 'skip' ? (
                <ActivityIndicator
                  size="small"
                  color={showRetry ? colors.primary[400] : colors.text.white}
                />
              ) : (
                <Text
                  style={showRetry ? styles.pausedButtonOutlineText : styles.pausedButtonFilledText}
                >
                  {showRetry
                    ? t('scan.loading.paused.skipButton')
                    : t('scan.loading.paused.skipContinueButton')}
                </Text>
              )}
            </TouchableOpacity>
          )}
          {showRetry && (
            <TouchableOpacity
              style={[
                styles.pausedButton,
                styles.pausedButtonFilled,
                actionLoading && styles.pausedButtonDisabled,
              ]}
              onPress={handleRetry}
              disabled={!!actionLoading}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('scan.loading.paused.accessibilityRetry')}
            >
              {actionLoading === 'retry' ? (
                <ActivityIndicator size="small" color={colors.text.white} />
              ) : (
                <Text style={styles.pausedButtonFilledText}>
                  {t('scan.loading.paused.retryButton')}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScanHelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
    </View>
  );
};

export default ScanLoadingScreen;
