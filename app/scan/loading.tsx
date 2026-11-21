import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getNewsletterStatus,
  NewsletterApiError,
  NewsletterStatus,
  resumeNewsletter as resumeNewsletterApi,
  retryAnalysis as retryAnalysisApi,
  skipNewsletterPage as skipNewsletterPageApi,
  uploadNewsletter as uploadNewsletterApi,
} from '../../src/api/newsletter';
import Header from '../../src/components/common/Header';
import ScanHelpModal from '../../src/components/scan/ScanHelpModal';
import ScanStepIndicator from '../../src/components/scan/ScanStepIndicator';
import colors from '../../src/constants/colors';
import { SCAN_FRAME_H, ScanChildParams } from '../../src/constants/scan';
import useResponsiveLayout from '../../src/hooks/useResponsiveLayout';
import { invalidateResources, queryClient, resourceKey } from '../../src/query/client';
import { useApiMutation, useServerQuery, useSessionScope } from '../../src/query/hooks';
import styles from '../../src/styles/scan/loading';
import { getPausedDescription, getPausedTitle } from '../../src/utils/newsletterPaused';
import { parsePagesParam } from '../../src/utils/scanNavigation';

const NEWSLETTER_RESOURCES = [
  'newsletters',
  'newsletter',
  'recent',
  'preview',
  'newsletterChecklist',
  'summary',
  'topics',
  'cultural',
  'translation',
];

const ScanLoadingScreen = () => {
  const retryAnalysis = useApiMutation(retryAnalysisApi, NEWSLETTER_RESOURCES);
  const skipNewsletterPage = useApiMutation(skipNewsletterPageApi, NEWSLETTER_RESOURCES);
  const resumeNewsletter = useApiMutation(resumeNewsletterApi, NEWSLETTER_RESOURCES);
  const uploadNewsletter = useApiMutation(uploadNewsletterApi, NEWSLETTER_RESOURCES);
  const {
    photoUri,
    pages,
    childId,
    childName,
    childColor,
    childGrade,
    newsletterId: resumeNewsletterIdParam,
  } = useLocalSearchParams<
    ScanChildParams & {
      photoUri?: string;
      pages?: string;
      newsletterId?: string;
    }
  >();
  const photoUris = useMemo(() => {
    if (pages) return parsePagesParam(pages);
    return photoUri ? [photoUri] : [];
  }, [pages, photoUri]);
  const displayUri = photoUris[0];
  const resumeNewsletterId = resumeNewsletterIdParam ? Number(resumeNewsletterIdParam) : undefined;

  const insets = useSafeAreaInsets();
  const { height, isCompact } = useResponsiveLayout();
  const frameStyle = { height: Math.min(height * 0.4, SCAN_FRAME_H), flex: 0 };
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
  const [helpVisible, setHelpVisible] = useState(false);
  const [newsletterId, setNewsletterId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<'retry' | 'skip' | null>(null);
  const scope = useSessionScope();
  const statusQuery = useServerQuery(
    'newsletterStatus',
    [newsletterId],
    (signal) => getNewsletterStatus(newsletterId!, signal),
    {
      enabled: newsletterId !== null,
      staleTime: 0,
      refetchInterval: (query) =>
        query.state.error ||
        ['COMPLETED', 'FAILED', 'PAUSED'].includes(query.state.data?.status ?? '')
          ? false
          : 2000,
    }
  );
  const {
    refetch: refetchStatus,
    isError: statusError,
    errorUpdatedAt: statusErrorAt,
  } = statusQuery;
  const displayPercent = statusQuery.data?.progressPercent ?? 0;
  const analysisStatus = statusQuery.data?.status ?? 'PENDING';
  const isComplete = analysisStatus === 'COMPLETED';
  const pausedInfo = analysisStatus === 'PAUSED' ? statusQuery.data : null;
  const pageProgress = {
    total: statusQuery.data?.totalPages,
    processed: statusQuery.data?.processedPages,
  };
  const startTaskRef = useRef<{ key: string; promise: Promise<number> } | null>(null);
  const inputKey = JSON.stringify([resumeNewsletterId, photoUris, childId]);

  useEffect(() => {
    if (isComplete) void invalidateResources(NEWSLETTER_RESOURCES, scope.version);
  }, [isComplete, newsletterId, scope.version]);

  const handleActionError = useCallback(() => {
    Alert.alert(t('scan.loading.error.analysisFailed'), t('scan.loading.error.analysisFailedMsg'));
  }, [t]);

  const applyResumeResult = useCallback(
    async (id: number, _result: { status: NewsletterStatus }) => {
      await queryClient.invalidateQueries({
        queryKey: resourceKey(scope.version, scope.language, 'newsletterStatus', id),
        refetchType: 'all',
      });
    },
    [scope.version, scope.language]
  );

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
    let active = true;
    if (!photoUris.length && resumeNewsletterId === undefined) return undefined;
    if (startTaskRef.current?.key !== inputKey) {
      const promise =
        resumeNewsletterId !== undefined
          ? resumeNewsletter(resumeNewsletterId).then(() => resumeNewsletterId)
          : uploadNewsletter(photoUris, childId ? Number(childId) : undefined).then(
              (result) => result.newsletterId
            );
      startTaskRef.current = { key: inputKey, promise };
    }
    startTaskRef.current.promise
      .then((id) => {
        if (active) setNewsletterId(id);
      })
      .catch((error: unknown) => {
        if (!active) return;
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
      active = false;
    };
  }, [inputKey, resumeNewsletterId, childId, resumeNewsletter, uploadNewsletter, photoUris, t]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: displayPercent / 100,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [displayPercent, progress]);

  useEffect(() => {
    if (!newsletterId || (analysisStatus !== 'FAILED' && !statusError)) return;
    Alert.alert(t('scan.loading.error.analysisFailed'), t('scan.loading.error.analysisFailedMsg'), [
      { text: t('common.cancel'), style: 'cancel', onPress: () => router.back() },
      {
        text: t('scan.loading.paused.retryButton'),
        onPress: () => {
          const operation =
            analysisStatus === 'FAILED'
              ? retryAnalysis(newsletterId).then((result) =>
                  applyResumeResult(newsletterId, result)
                )
              : refetchStatus();
          void operation.catch(handleActionError);
        },
      },
    ]);
  }, [
    analysisStatus,
    newsletterId,
    statusError,
    statusErrorAt,
    retryAnalysis,
    refetchStatus,
    applyResumeResult,
    handleActionError,
    t,
  ]);

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
    outputRange: [0, frameStyle.height],
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
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
      <Header title={t('scan.title')} onHelp={() => setHelpVisible(true)} />
      <ScanStepIndicator currentStep={isComplete ? 4 : 3} />

      {isComplete ? (
        <Animated.View style={[styles.completionFrame, frameStyle, { opacity: frameOpacity }]}>
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
        <View style={[styles.imageWrapper, frameStyle]}>
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
            <Text style={styles.statusTitle}>{statusTitle}</Text>
            {!isComplete && (
              <Text style={styles.statusSubtitle}>
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
        <View style={[styles.pausedButtonRow, isCompact && styles.buttonsStacked]}>
          {showSkip && (
            <TouchableOpacity
              style={[
                styles.pausedButton,
                isCompact && styles.buttonFullWidth,
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
                isCompact && styles.buttonFullWidth,
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
    </ScrollView>
  );
};

export default ScanLoadingScreen;
