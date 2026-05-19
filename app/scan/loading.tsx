import React, { useEffect, useRef, useState } from 'react';
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
import Header from '../../src/components/common/Header';
import ScanHelpModal from '../../src/components/scan/ScanHelpModal';
import ScanStepIndicator from '../../src/components/scan/ScanStepIndicator';
import {
  uploadNewsletter,
  getNewsletterStatus,
  NewsletterApiError,
} from '../../src/api/newsletter';
import { SCAN_FRAME_H } from '../../src/constants/scan';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/scan/loading';

const ScanLoadingScreen = () => {
  const { photoUri, childId, childName, childColor, childGrade } = useLocalSearchParams<{
    photoUri: string;
    childId: string;
    childName: string;
    childColor: string;
    childGrade: string;
  }>();

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
  const [displayPercent, setDisplayPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('문서를 준비하고 있어요');
  const [isComplete, setIsComplete] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [newsletterId, setNewsletterId] = useState<number | null>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
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
  }, [scanLine]);

  useEffect(() => {
    if (!photoUri) return () => {};
    let cancelled = false;

    const startPolling = (id: number) => {
      const poll = async () => {
        if (cancelled) return;
        try {
          const result = await getNewsletterStatus(id);
          if (cancelled) return;

          setDisplayPercent(result.progressPercent);
          setProgressMessage(result.progressMessage);
          Animated.timing(progress, {
            toValue: result.progressPercent / 100,
            duration: 400,
            useNativeDriver: false,
          }).start();

          if (result.status === 'COMPLETED') {
            setIsComplete(true);
            return;
          }
          if (result.status === 'FAILED') {
            Alert.alert('분석 실패', '문서 분석에 실패했어요. 다시 시도해주세요.', [
              { text: '확인', onPress: () => router.back() },
            ]);
            return;
          }
        } catch {
          // 폴링 중 네트워크 오류는 무시하고 계속 시도
        }
        pollingRef.current = setTimeout(poll, 2000);
      };

      pollingRef.current = setTimeout(poll, 2000);
    };

    const parsedChildId = childId ? Number(childId) : undefined;
    uploadNewsletter(photoUri, parsedChildId)
      .then((result) => {
        if (cancelled) return;
        setNewsletterId(result.newsletterId);
        startPolling(result.newsletterId);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        let message = '업로드에 실패했어요. 다시 시도해주세요.';
        if (error instanceof NewsletterApiError) {
          if (error.code === 'NL4091') message = '이미 업로드된 가정통신문이에요.';
          else if (error.code === 'NL4002') message = '지원하지 않는 파일 형식이에요.';
          else if (error.code === 'NL4003') message = '파일 크기가 10MB를 초과해요.';
        }
        Alert.alert('업로드 실패', message, [{ text: '확인', onPress: () => router.back() }]);
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

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const scanLineY = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_FRAME_H],
  });

  return (
    <View style={styles.screen}>
      <Header title="문서 스캔" onHelp={() => setHelpVisible(true)} />
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
            스캔 완료!
          </Animated.Text>
        </Animated.View>
      ) : (
        <View style={styles.imageWrapper}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
          <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]} />
        </View>
      )}

      <View style={styles.statusArea}>
        <View style={styles.statusRow}>
          {isComplete ? (
            <View style={styles.doneIcon}>
              <Ionicons name="checkmark" size={22} color={colors.text.white} />
            </View>
          ) : (
            <ActivityIndicator size="large" color={colors.primary[400]} />
          )}
          <View style={styles.statusTexts}>
            <Text style={styles.statusTitle}>
              {isComplete ? '번역 및 요약을 완료했어요!' : progressMessage}
            </Text>
            {!isComplete && (
              <Text style={styles.statusSubtitle}>텍스트와 레이아웃을 분석하고 있어요</Text>
            )}
          </View>
          <Text style={styles.percentText}>{displayPercent}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>

      {isComplete && (
        <Animated.View
          style={[
            styles.nextBtnWrapper,
            {
              opacity: nextBtnOpacity,
              transform: [{ translateY: nextBtnSlide }],
              marginBottom: insets.bottom + 16,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.nextBtn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="다음으로"
            onPress={() =>
              router.push({
                pathname: '/scan/result',
                params: {
                  photoUri,
                  childName,
                  childColor,
                  childGrade,
                  newsletterId: String(newsletterId),
                },
              })
            }
          >
            <Text style={styles.nextBtnText}>다음으로 →</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      <ScanHelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
    </View>
  );
};

export default ScanLoadingScreen;
