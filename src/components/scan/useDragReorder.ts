import { useCallback, useLayoutEffect, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
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
  const previousIndex = useRef(index);

  const commitReorder = useCallback((from: number, to: number) => onReorder(from, to), [onReorder]);
  const notifyActive = useCallback((active: boolean) => onActiveChange?.(active), [onActiveChange]);

  useLayoutEffect(() => {
    if (previousIndex.current === index) return;
    previousIndex.current = index;
    translateY.value = 0;
    if (isActive.value) {
      isActive.value = false;
      notifyActive(false);
    }
  }, [index, isActive, translateY, notifyActive]);

  const pan = Gesture.Pan()
    .activateAfterLongPress(220)
    .onStart(() => {
      isActive.value = true;
      scheduleOnRN(notifyActive, true);
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd((_event, success) => {
      if (!success) return;
      const offset = Math.round(translateY.value / rowHeight);
      const targetIndex = Math.min(Math.max(index + offset, 0), itemCount - 1);
      if (targetIndex !== index) {
        // Keep the card at its destination until React commits the new row index.
        translateY.value = (targetIndex - index) * rowHeight;
        scheduleOnRN(commitReorder, index, targetIndex);
      } else {
        translateY.value = 0;
        isActive.value = false;
        scheduleOnRN(notifyActive, false);
      }
    })
    .onFinalize((_event, success) => {
      if (!success && isActive.value) {
        translateY.value = 0;
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
