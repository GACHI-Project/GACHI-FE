import { useEffect, useLayoutEffect, useRef } from 'react';
import { Animated } from 'react-native';
import type { ProcessingPhase } from './useNewsletterProcessing';

const useNewsletterProcessingAnimation = (
  identity: string,
  phase: ProcessingPhase,
  percent: number,
  frameHeight: number
) => {
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
  const isComplete = phase === 'completed';
  useLayoutEffect(() => {
    progress.setValue(0);
    scanLine.setValue(0);
    frameOpacity.setValue(0);
    checkmarkScale.setValue(0);
    glowPulse.setValue(1);
    textOpacity.setValue(0);
    textSlide.setValue(20);
    nextBtnOpacity.setValue(0);
    nextBtnSlide.setValue(30);
  }, [
    identity,
    progress,
    scanLine,
    frameOpacity,
    checkmarkScale,
    glowPulse,
    textOpacity,
    textSlide,
    nextBtnOpacity,
    nextBtnSlide,
  ]);

  useEffect(() => {
    if (phase !== 'starting' && phase !== 'processing') return undefined;
    const animation = Animated.loop(
      Animated.timing(scanLine, { toValue: 1, duration: 2500, useNativeDriver: true })
    );
    scanLine.setValue(0);
    animation.start();
    return () => animation.stop();
  }, [identity, phase, scanLine]);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: percent / 100,
      duration: 400,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [identity, percent, progress]);

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

    let active = true;
    completionAnimation.current.start(({ finished }) => {
      if (!active || !finished) return;
      glowAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, { toValue: 1.12, duration: 950, useNativeDriver: true }),
          Animated.timing(glowPulse, { toValue: 1.0, duration: 950, useNativeDriver: true }),
        ])
      );
      glowAnimation.current.start();
    });

    return () => {
      active = false;
      completionAnimation.current?.stop();
      glowAnimation.current?.stop();
    };
  }, [
    identity,
    isComplete,
    frameOpacity,
    checkmarkScale,
    glowPulse,
    textOpacity,
    textSlide,
    nextBtnOpacity,
    nextBtnSlide,
  ]);

  return {
    frameOpacity,
    checkmarkScale,
    glowPulse,
    textOpacity,
    textSlide,
    nextBtnOpacity,
    nextBtnSlide,
    progressWidth: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
    scanLineY: scanLine.interpolate({ inputRange: [0, 1], outputRange: [0, frameHeight] }),
  };
};

export default useNewsletterProcessingAnimation;
