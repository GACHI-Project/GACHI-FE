import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

const useModalClosed = (visible: boolean, onClosed: () => void) => {
  const wasVisible = useRef(visible);

  useEffect(() => {
    const didClose = wasVisible.current && !visible;
    wasVisible.current = visible;
    // iOS는 네이티브 dismiss 애니메이션의 onDismiss를 기다린다.
    // Android는 visible=false가 커밋되면 Dialog가 제거되며 onDismiss를 제공하지 않는다.
    if (didClose && Platform.OS !== 'ios') onClosed();
  }, [visible, onClosed]);
};

export default useModalClosed;
