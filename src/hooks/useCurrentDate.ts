import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { fmt } from '../utils/date';

const useCurrentDate = () => {
  const [today, setToday] = useState(() => fmt(new Date()));
  useEffect(() => {
    const refresh = () => setToday(fmt(new Date()));
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const timer = setTimeout(refresh, midnight.getTime() - now.getTime());
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearTimeout(timer);
      listener.remove();
    };
  }, [today]);
  return today;
};
export default useCurrentDate;
