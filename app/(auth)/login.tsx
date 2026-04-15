import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AuthInput from '../../src/components/auth/AuthInput';
import { PrimaryButton } from '../../src/components/common/Button';
import colors from '../../src/constants/colors';
import fonts from '../../src/constants/fonts';
import layout from '../../src/constants/layout';

const LoginScreen = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[colors.primary[300], colors.primary[100]]} style={styles.gradient} />
      <View style={styles.container}>
        <Text style={styles.title}>로그인하기</Text>

        <AuthInput
          label="ID"
          value={id}
          onChangeText={setId}
          iconName="person-outline"
          onClear={() => setId('')}
        />

        <AuthInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          iconName="lock-closed-outline"
          secureTextEntry={!showPassword}
          onToggleSecure={() => setShowPassword((prev) => !prev)}
        />

        <View style={styles.stayLoggedInRow}>
          <TouchableOpacity
            style={[styles.checkbox, stayLoggedIn && styles.checkboxChecked]}
            onPress={() => setStayLoggedIn((prev) => !prev)}
          >
            {stayLoggedIn && <Text style={styles.checkboxMark}>✓</Text>}
          </TouchableOpacity>
          <Text style={styles.stayLoggedInText}>로그인 상태 유지</Text>
        </View>

        <PrimaryButton label="로그인" onPress={() => router.push('/(tabs)')} />

        <View style={styles.forgotRow}>
          <TouchableOpacity>
            <Text style={styles.forgotText}>아이디 찾기</Text>
          </TouchableOpacity>
          <View style={styles.forgotDivider} />
          <TouchableOpacity>
            <Text style={styles.forgotText}>비밀번호 찾기</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/register/language')}>
          <Text style={styles.signUpText}>
            계정이 없으신가요?{'  '}
            <Text style={styles.signUpLink}>회원가입</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary[100],
  },
  gradient: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.text.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: 40,
    paddingBottom: 60,
    gap: 18,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  stayLoggedInRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
  },
  checkbox: {
    width: 15,
    height: 15,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[0],
  },
  checkboxChecked: {
    backgroundColor: colors.primary[400],
    borderColor: colors.primary[400],
  },
  checkboxMark: {
    color: colors.text.white,
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
  },
  stayLoggedInText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.primary,
  },
  forgotDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.gray[300],
  },
  signUpText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.primary,
    textAlign: 'center',
  },
  signUpLink: {
    fontFamily: fonts.semiBold,
  },
});
