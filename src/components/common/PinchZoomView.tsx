import { ReactNode, useCallback, useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

interface PinchZoomViewProps {
  active: boolean;
  onZoomChange?: (zoomed: boolean) => void;
  maxZoom?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

const DEFAULT_MAX_ZOOM = 3;

const PinchZoomView = ({
  active,
  onZoomChange,
  maxZoom = DEFAULT_MAX_ZOOM,
  style,
  children,
}: PinchZoomViewProps) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const notifyZoom = useCallback((zoomed: boolean) => onZoomChange?.(zoomed), [onZoomChange]);

  useEffect(() => {
    if (!active) {
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  }, [active, scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]);

  const pinch = Gesture.Pinch()
    .enabled(active)
    .onUpdate((event) => {
      scale.value = Math.max(1, Math.min(savedScale.value * event.scale, maxZoom));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      scheduleOnRN(notifyZoom, scale.value > 1.05);
      if (scale.value <= 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .enabled(active)
    .onUpdate((event) => {
      if (savedScale.value <= 1) return;
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composed = Gesture.Simultaneous(pinch, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
};

export default PinchZoomView;
