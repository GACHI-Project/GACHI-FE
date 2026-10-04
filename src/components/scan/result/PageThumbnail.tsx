import { Image, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../constants/colors';
import { SourceType } from '../../../api/newsletter';

interface PageThumbnailProps {
  sourceType: SourceType;
  imageUrl?: string;
  width?: number;
  height?: number;
}

const DEFAULT_WIDTH = 40;
const DEFAULT_HEIGHT = 54;

const PageThumbnail = ({
  sourceType,
  imageUrl,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
}: PageThumbnailProps) => {
  const size = { width, height, borderRadius: 5 };

  if (sourceType === 'IMAGE' && imageUrl) {
    return <Image source={{ uri: imageUrl }} style={size} />;
  }

  return (
    <View style={[styles.placeholder, size]}>
      <Ionicons
        name="document-text-outline"
        size={Math.round(width * 0.45)}
        color={colors.primary[400]}
      />
    </View>
  );
};

export default PageThumbnail;

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.primary[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
