import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { NewsletterApiError } from '../../src/api/newsletter';
import Header from '../../src/components/common/Header';
import ScanHelpModal from '../../src/components/scan/ScanHelpModal';
import ScanStepIndicator from '../../src/components/scan/ScanStepIndicator';
import colors from '../../src/constants/colors';
import { SCAN_FRAME_H, ScanChildParams } from '../../src/constants/scan';
import useResponsiveLayout from '../../src/hooks/useResponsiveLayout';
import useNewsletterProcessing from '../../src/hooks/scan/useNewsletterProcessing';
import useNewsletterProcessingAnimation from '../../src/hooks/scan/useNewsletterProcessingAnimation';
import styles from '../../src/styles/scan/loading';
import { getPausedDescription, getPausedTitle } from '../../src/utils/newsletterPaused';
import { parsePagesParam } from '../../src/utils/scanNavigation';

const ScanLoadingScreen = () => {
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
  const { t } = useTranslation();
  const [helpVisible, setHelpVisible] = useState(false);
  const processing = useNewsletterProcessing({
    photoUris,
    childId: childId ? Number(childId) : undefined,
    resumeNewsletterId,
  });
  const {
    newsletterId,
    phase,
    status,
    action: actionLoading,
    error,
    retry: handleRetry,
    skipPage: handleSkip,
    isCurrent,
    canRetry,
    canSkip,
  } = processing;
  const isComplete = phase === 'completed';
  const analysisStatus = status?.status ?? 'PENDING';
  const displayPercent = status?.progressPercent ?? 0;
  const pausedInfo = status?.status === 'PAUSED' ? status : null;
  const pageProgress = { total: status?.totalPages, processed: status?.processedPages };
  const {
    frameOpacity,
    checkmarkScale,
    glowPulse,
    textOpacity,
    textSlide,
    nextBtnOpacity,
    nextBtnSlide,
    progressWidth,
    scanLineY,
  } = useNewsletterProcessingAnimation(processing.key, phase, displayPercent, frameStyle.height);
  const alertedError = useRef<typeof error>(null);
  useEffect(() => {
    if (!error || !isCurrent() || alertedError.current === error) return;
    alertedError.current = error;
    const close = () => {
      if (isCurrent()) router.back();
    };
    if (error.kind === 'start') {
      let message = t('scan.loading.error.uploadDefault');
      if (error.cause instanceof NewsletterApiError) {
        if (error.cause.code === 'NL4091') message = t('scan.loading.error.duplicate');
        else if (error.cause.code === 'NL4002') message = t('scan.loading.error.unsupportedFormat');
        else if (error.cause.code === 'NL4003') message = t('scan.loading.error.fileTooLarge');
      }
      Alert.alert(t('scan.loading.error.uploadFailed'), message, [
        { text: t('common.confirm'), onPress: close },
      ]);
      return;
    }
    Alert.alert(
      t('scan.loading.error.analysisFailed'),
      t('scan.loading.error.analysisFailedMsg'),
      error.retryable
        ? [
            { text: t('common.cancel'), style: 'cancel', onPress: close },
            {
              text: t('scan.loading.paused.retryButton'),
              onPress: () => {
                void handleRetry();
              },
            },
          ]
        : [{ text: t('common.confirm'), onPress: error.kind === 'action' ? undefined : close }]
    );
  }, [error, handleRetry, isCurrent, t]);

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
  const showRetry = !!pausedInfo && canRetry;
  const showSkip = !!pausedInfo && canSkip;

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
            onPress={() => {
              if (!isCurrent()) return;
              router.push({
                pathname: '/scan/result',
                params: {
                  photoUri: displayUri,
                  childName,
                  childColor,
                  childGrade,
                  newsletterId: String(newsletterId),
                },
              });
            }}
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
