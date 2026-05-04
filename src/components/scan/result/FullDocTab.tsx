import { useState } from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import colors from '../../../constants/colors';
import fonts from '../../../constants/fonts';

interface Props {
  photoUri: string;
}

export default function FullDocTab({ photoUri }: Props) {
  const { width } = useWindowDimensions();
  const containerWidth = width - 40;
  const [imageHeight, setImageHeight] = useState(300);

  return (
    <View>
      <Text style={styles.sectionLabel}>번역된 문서</Text>
      <View style={styles.card}>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={[styles.image, { height: imageHeight }]}
            resizeMode="contain"
            onLoad={(e) => {
              const { width: w, height: h } = e.nativeEvent.source;
              setImageHeight((h / w) * containerWidth);
            }}
          />
        ) : (
          <View style={[styles.image, { height: imageHeight }]} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
    marginBottom: 10,
  },
  card: {
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    overflow: 'hidden',
    shadowColor: colors.gray[300],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
  },
});
