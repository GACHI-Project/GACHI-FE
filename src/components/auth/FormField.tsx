import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

interface RightButton {
  label: string;
  onPress: () => void;
}

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  editable?: boolean;
  rightButton?: RightButton;
  rightIcon?: 'eye-outline' | 'eye-off-outline';
  onRightIconPress?: () => void;
  validationMessage?: string;
  validationState?: 'success' | 'error';
  bottomElement?: React.ReactNode;
}

const FormField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'none',
  secureTextEntry = false,
  editable = true,
  rightButton,
  rightIcon,
  onRightIconPress,
  validationMessage,
  validationState,
  bottomElement,
}: FormFieldProps) => (
  <View style={styles.wrapper}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.row}>
      <View style={[styles.inputContainer, !editable && styles.inputDisabled]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[200]}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          editable={editable}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} hitSlop={8}>
            <Ionicons name={rightIcon} size={20} color={colors.gray[300]} />
          </TouchableOpacity>
        )}
      </View>
      {rightButton && (
        <TouchableOpacity style={styles.button} onPress={rightButton.onPress}>
          <Text style={styles.buttonText}>{rightButton.label}</Text>
        </TouchableOpacity>
      )}
    </View>
    {bottomElement}
    {validationMessage && (
      <View style={styles.validationRow}>
        <Ionicons
          name={validationState === 'success' ? 'checkmark' : 'close'}
          size={12}
          color={validationState === 'success' ? colors.primary[500] : colors.text.red}
        />
        <Text
          style={[
            styles.validationText,
            validationState === 'success' ? styles.success : styles.error,
          ]}
        >
          {validationMessage}
        </Text>
      </View>
    )}
  </View>
);

export default FormField;

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.gray[100],
    gap: 8,
  },
  inputDisabled: {
    backgroundColor: colors.gray[100],
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text.primary,
    padding: 0,
  },
  button: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  validationText: {
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  success: {
    color: colors.primary[500],
  },
  error: {
    color: colors.text.red,
  },
});
