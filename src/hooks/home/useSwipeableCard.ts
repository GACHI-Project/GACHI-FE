import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { Animated, Easing, PanResponder } from 'react-native';

const SLIDE_DURATION = 550;
const AUTO_INTERVAL = 5000;

const useSwipeableCard = (itemCount: number, cardWidth: number) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeIdxRef = useRef(0);
  const isPausedRef = useRef(false);
  const translateX = useRef(new Animated.Value(0)).current;

  const slideTo = useCallback(
    (idx: number) => {
      activeIdxRef.current = idx;
      setActiveIdx(idx);
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

  useEffect(() => {
    if (!itemCount) return;
    const clamped = Math.min(activeIdxRef.current, itemCount - 1);
    if (clamped !== activeIdxRef.current) {
      activeIdxRef.current = clamped;
      setActiveIdx(clamped);
    }
    translateX.setValue(-clamped * cardWidth);
  }, [itemCount, cardWidth, translateX]);

  useEffect(() => {
    if (itemCount <= 1) return undefined;
    const interval = setInterval(() => {
      if (!isPausedRef.current) {
        const next = (activeIdxRef.current + 1) % itemCount;
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
