import { useCallback, useEffect, useRef, useState } from 'react';

// 다음 모달이나 화면은 현재 모달의 닫힘 완료 통지 이후에만 연다.
const useScanModalFlow = <T extends string>(baseMode: T, initialMode: T) => {
  const [viewMode, updateViewMode] = useState<T>(initialMode);
  const [closing, setClosing] = useState(false);
  const modeRef = useRef(initialMode);
  const pendingAction = useRef<(() => void) | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      pendingAction.current = null;
    };
  }, []);

  const runAfterModalClose = useCallback(
    (action: () => void) => {
      if (!mounted.current || pendingAction.current) return false;
      if (modeRef.current === baseMode) {
        action();
      } else {
        pendingAction.current = action;
        modeRef.current = baseMode;
        setClosing(true);
        updateViewMode(baseMode);
      }
      return true;
    },
    [baseMode]
  );

  const setViewMode = useCallback(
    (next: T) => {
      if (modeRef.current === next) return;
      runAfterModalClose(() => {
        modeRef.current = next;
        updateViewMode(next);
      });
    },
    [runAfterModalClose]
  );

  const onModalClosed = useCallback(() => {
    if (!mounted.current) return;
    const action = pendingAction.current;
    pendingAction.current = null;
    setClosing(false);
    action?.();
  }, []);

  return { viewMode, setViewMode, closing, runAfterModalClose, onModalClosed };
};

export default useScanModalFlow;
