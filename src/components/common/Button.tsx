import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export const PrimaryButton = ({ label, onPress, disabled = false }: ButtonProps) => (
  <TouchableOpacity
    style={[styles.primary, disabled && styles.primaryDisabled]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
  >
    <Text style={styles.primaryLabel}>{label}</Text>
  </TouchableOpacity>
);

export const SecondaryButton = ({ label, onPress, disabled = false }: ButtonProps) => (
  <TouchableOpacity
    style={[styles.secondary, disabled && styles.secondaryDisabled]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    <Text style={styles.secondaryLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary[400],
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: {
    backgroundColor: colors.primary[200],
  },
  primaryLabel: {
    color: colors.text.white,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text.white,
  },
  secondaryDisabled: {
    borderColor: colors.gray[200],
  },
  secondaryLabel: {
    color: colors.gray[300],
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
});
