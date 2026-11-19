import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { Animated, Easing, PanResponder } from 'react-native';

const SLIDE_DURATION = 550;
const AUTO_INTERVAL = 5000;

const useSwipeableCard = (itemCount: number, cardWidth: number) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const activeIdx = Math.min(selectedIdx, Math.max(itemCount - 1, 0));
  const activeIdxRef = useRef(0);
  const isPausedRef = useRef(false);
  const translateX = useRef(new Animated.Value(0)).current;

  const slideTo = useCallback(
    (idx: number) => {
      activeIdxRef.current = idx;
      setSelectedIdx(idx);
      Animated.timing(translateX, {
        toValue: -idx * cardWidth,
        duration: SLIDE_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [cardWidth, translateX]
  );

  const slideToRef = useRef(slideTo);
  const itemsLengthRef = useRef(itemCount);
  useLayoutEffect(() => {
    slideToRef.current = slideTo;
    itemsLengthRef.current = itemCount;
  });

  useLayoutEffect(() => {
    const clamped = Math.min(activeIdxRef.current, Math.max(itemCount - 1, 0));
    if (clamped !== activeIdxRef.current) {
      activeIdxRef.current = clamped;
      setSelectedIdx(clamped);
    }
    translateX.setValue(-clamped * cardWidth);
  }, [itemCount, cardWidth, translateX]);

  useEffect(() => {
    if (itemCount <= 1) return undefined;
    const interval = setInterval(() => {
      const count = itemsLengthRef.current;
      if (!isPausedRef.current && count > 1) {
        const next = (activeIdxRef.current + 1) % count;
        slideToRef.current(next);
      }
    }, AUTO_INTERVAL);
    return () => clearInterval(interval);
  }, [itemCount]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        const len = itemsLengthRef.current;
        if (len <= 1) return;
        if (g.dx < -40) {
          slideToRef.current((activeIdxRef.current + 1) % len);
        } else if (g.dx > 40) {
          slideToRef.current((activeIdxRef.current - 1 + len) % len);
        }
      },
    })
  ).current;

  return { activeIdx, isPausedRef, translateX, panResponder };
};

export default useSwipeableCard;
