import { useCallback } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export const reorderArray = <T>(arr: T[], from: number, to: number): T[] => {
  if (from === to) return arr;
  const copy = [...arr];
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
};

interface UseDragRowParams {
  index: number;
  itemCount: number;
  rowHeight: number;
  onReorder: (from: number, to: number) => void;
  onActiveChange?: (active: boolean) => void;
}

export const useDragRow = ({
  index,
  itemCount,
  rowHeight,
  onReorder,
  onActiveChange,
}: UseDragRowParams) => {
  const translateY = useSharedValue(0);
  const isActive = useSharedValue(false);

  const commitReorder = useCallback((from: number, to: number) => onReorder(from, to), [onReorder]);
  const notifyActive = useCallback((active: boolean) => onActiveChange?.(active), [onActiveChange]);

  const pan = Gesture.Pan()
    .activateAfterLongPress(220)
    .onStart(() => {
      isActive.value = true;
      scheduleOnRN(notifyActive, true);
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      const offset = Math.round(translateY.value / rowHeight);
      const targetIndex = Math.min(Math.max(index + offset, 0), itemCount - 1);
      translateY.value = withSpring(0, { damping: 18 });
      isActive.value = false;
      scheduleOnRN(notifyActive, false);
      if (targetIndex !== index) {
        scheduleOnRN(commitReorder, index, targetIndex);
      }
    })
    .onFinalize(() => {
      if (isActive.value) {
        translateY.value = withSpring(0, { damping: 18 });
        isActive.value = false;
        scheduleOnRN(notifyActive, false);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    zIndex: isActive.value ? 10 : 0,
    shadowOpacity: isActive.value ? 0.15 : 0,
  }));

  return { pan, animatedStyle };
};
