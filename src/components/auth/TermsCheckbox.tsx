import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onTermsPress: () => void;
  onPrivacyPress: () => void;
}

const TermsCheckbox = ({ checked, onChange, onTermsPress, onPrivacyPress }: TermsCheckboxProps) => (
  <TouchableOpacity style={styles.container} onPress={() => onChange(!checked)} activeOpacity={0.7}>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Text style={styles.checkmark}>✓</Text>}
    </View>
    <Text style={styles.text}>
      <Text style={styles.link} onPress={onTermsPress}>
        이용약관
      </Text>
      <Text> 및 </Text>
      <Text style={styles.link} onPress={onPrivacyPress}>
        개인정보 처리방침
      </Text>
      <Text>에 동의합니다. 입력하신 정보는 외부에 공유되지 않아요.</Text>
    </Text>
  </TouchableOpacity>
);

export default TermsCheckbox;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    backgroundColor: colors.text.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.primary[400],
    borderColor: colors.primary[400],
  },
  checkmark: {
    color: colors.text.white,
    fontSize: 11,
    lineHeight: 14,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  link: {
    fontFamily: fonts.medium,
    color: colors.primary[500],
    textDecorationLine: 'underline',
  },
});
