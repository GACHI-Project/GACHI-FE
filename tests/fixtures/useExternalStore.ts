import { useEffect, useSyncExternalStore } from 'react';

interface Store {
  getSnapshot: () => number;
  subscribe: (listener: () => void) => () => void;
  beforeSubscribe: () => void;
}

const useExternalStore = ({ getSnapshot, subscribe, beforeSubscribe }: Store) => {
  useEffect(beforeSubscribe, [beforeSubscribe]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

export default useExternalStore;
