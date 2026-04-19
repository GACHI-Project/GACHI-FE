import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onTermsPress: () => void;
  onPrivacyPress: () => void;
}

const TermsCheckbox = ({ checked, onChange, onTermsPress, onPrivacyPress }: TermsCheckboxProps) => (
  <View style={styles.wrapper}>
    <Pressable
      onPress={() => onChange(!checked)}
      // 💡 This is the main box container mimicking other inputs
      style={({ pressed }) => [styles.containerBox, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.innerLayout}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Text style={styles.checkmark}>✓</Text>}
        </View>

        <View style={styles.textSection}>
          <Text style={styles.mainText}>이용약관 및 개인정보 처리방침에 동의합니다.</Text>
          <Text style={styles.subText}>필수 약관을 확인한 뒤 체크해주세요.</Text>
        </View>
      </View>
    </Pressable>

    <View style={styles.linkRow}>
      <Pressable onPress={onTermsPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 4 }}>
        <Text style={styles.linkText}>이용약관 보기</Text>
      </Pressable>

      <Text style={styles.dot}>|</Text>

      <Pressable onPress={onPrivacyPress} hitSlop={{ top: 10, bottom: 10, left: 4, right: 10 }}>
        <Text style={styles.linkText}>개인정보 처리방침 보기</Text>
      </Pressable>
    </View>
  </View>
);

export default TermsCheckbox;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
    gap: 10,
  },
  containerBox: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
  },
  innerLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    backgroundColor: colors.text.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary[400],
    borderColor: colors.primary[400],
  },
  checkmark: {
    color: colors.text.white,
    fontSize: 18,
    lineHeight: 16,
    fontFamily: fonts.semiBold,
    marginTop: 1,
  },
  textSection: {
    flex: 1,
    gap: 2,
  },
  mainText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.medium,
    color: colors.text.primary,
  },
  subText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    opacity: 0.8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    gap: 8,
  },
  linkText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.gray[300],
  },
  dot: {
    fontSize: 12,
    color: colors.gray[200],
    marginTop: -1,
  },
});
