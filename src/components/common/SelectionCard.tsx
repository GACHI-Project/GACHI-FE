import type { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

type CardSize = 'lg' | 'md' | 'sm';

const SIZE_CONFIG = {
  lg: { height: 90, paddingH: 22, nameSize: 20, labelSize: 16 },
  md: { height: 90, paddingH: 22, nameSize: 18, labelSize: 16 },
  sm: { height: 64, paddingH: 16, nameSize: 14, labelSize: 12 },
} as const;

interface SelectionCardProps {
  name: string;
  label: string;
  leftElement: ReactNode;
  selected: boolean;
  onPress: () => void;
  size?: CardSize;
  indicatorColor?: string;
}

const SelectionCard = ({
  name,
  label,
  leftElement,
  selected,
  onPress,
  size = 'lg',
  indicatorColor,
}: SelectionCardProps) => {
  const s = SIZE_CONFIG[size];
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { minHeight: s.height, paddingHorizontal: s.paddingH },
        selected && styles.cardSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      {selected && <View style={styles.selectedBar} />}
      {leftElement}
      <View style={styles.content}>
        <Text style={[styles.name, { fontSize: s.nameSize }]}>{name}</Text>
        <Text style={[styles.label, { fontSize: s.labelSize }]}>{label}</Text>
      </View>
      {size === 'md' && indicatorColor && (
        <View style={[styles.dot, { backgroundColor: indicatorColor }]} />
      )}
      <View style={[styles.radio, selected && styles.radioSelected]} />
    </TouchableOpacity>
  );
};

export default SelectionCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 15,
    paddingVertical: 14,
    gap: 14,
    overflow: 'hidden',
  },
  cardSelected: {
    backgroundColor: colors.primary[0],
    borderColor: colors.primary[400],
    shadowColor: '#1F2A37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  selectedBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary[400],
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
  },
  content: {
    flex: 1,
    minHeight: 0,
    gap: 2,
  },
  name: {
    fontFamily: fonts.medium,
    color: colors.text.primary,
  },
  label: {
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    flexShrink: 0,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.text.white,
  },
  radioSelected: {
    backgroundColor: colors.primary[0],
    borderColor: colors.primary[400],
    borderWidth: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
});
