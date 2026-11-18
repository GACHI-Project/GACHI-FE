import { useWindowDimensions } from 'react-native';

const useResponsiveLayout = () => {
  const dimensions = useWindowDimensions();
  return {
    ...dimensions,
    isCompact: dimensions.width / Math.max(dimensions.fontScale, 1) < 360,
  };
};

export default useResponsiveLayout;
