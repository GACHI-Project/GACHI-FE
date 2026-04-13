import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

interface AuthInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  secureTextEntry?: boolean;
  onToggleSecure?: () => void;
  onClear?: () => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

const AuthInput = ({
  label,
  value,
  onChangeText,
  iconName,
  secureTextEntry = false,
  onToggleSecure,
  onClear,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: AuthInputProps) => (
  <View style={styles.container}>
    <Ionicons name={iconName} size={20} color={colors.primary[300]} />
    <View style={styles.divider} />
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={colors.gray[300]}
      />
    </View>
    {onClear && value.length > 0 && (
      <TouchableOpacity onPress={onClear}>
        <Ionicons name="close-circle" size={20} color={colors.gray[300]} />
      </TouchableOpacity>
    )}
    {onToggleSecure && (
      <TouchableOpacity onPress={onToggleSecure}>
        <Ionicons
          name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={colors.gray[300]}
        />
      </TouchableOpacity>
    )}
  </View>
);

export default AuthInput;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.primary[300],
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 60,
    gap: 16,
  },
  divider: {
    width: 1,
    height: 43,
    backgroundColor: colors.primary[300],
  },
  inputWrapper: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: fonts.semiBold,
  },
  input: {
    fontSize: 14,
    color: colors.text.primary,
    fontFamily: fonts.medium,
    padding: 0,
  },
});
