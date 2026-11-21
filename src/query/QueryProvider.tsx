import NetInfo from '@react-native-community/netinfo';
import { QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { queryClient } from './client';

const QueryProvider = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    onlineManager.setEventListener((setOnline) =>
      NetInfo.addEventListener((state) => {
        setOnline(state.isConnected !== false && state.isInternetReachable !== false);
      })
    );
    if (Platform.OS === 'web') return () => onlineManager.setEventListener(() => () => {});
    focusManager.setFocused(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });
    return () => {
      subscription.remove();
      focusManager.setFocused(undefined);
      onlineManager.setEventListener(() => () => {});
    };
  }, []);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default QueryProvider;
