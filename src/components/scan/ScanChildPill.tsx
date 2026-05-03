import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

interface ScanChildPillProps {
  name: string;
  color: string;
  onChangePress?: () => void;
}

const ScanChildPill = ({ name, color, onChangePress }: ScanChildPillProps) => (
  <View style={styles.pill}>
    <View style={[styles.dot, { backgroundColor: color }]} />
    <Text style={styles.text}>
      <Text style={styles.name}>{name}</Text>
      {' 의 가정통신문'}
    </Text>
    {onChangePress && (
      <TouchableOpacity
        onPress={onChangePress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="아이 변경"
        accessibilityRole="button"
      >
        <Text style={styles.change}>변경</Text>
      </TouchableOpacity>
    )}
  </View>
);

export default ScanChildPill;

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primary[400],
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 6,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.white,
  },
  name: {
    fontFamily: fonts.semiBold,
  },
  change: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
    textDecorationLine: 'underline',
    marginLeft: 2,
  },
});
