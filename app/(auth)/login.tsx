import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import AuthInput from '../../src/components/auth/AuthInput';
import { PrimaryButton } from '../../src/components/common/Button';
import { login, AuthApiError } from '../../src/api/auth';
import colors from '../../src/constants/colors';
import fonts from '../../src/constants/fonts';
import layout from '../../src/constants/layout';

const LoginScreen = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage(undefined);
    try {
      const result = await login(id, password, stayLoggedIn);
      await SecureStore.setItemAsync('accessToken', result.accessToken);
      await SecureStore.setItemAsync('refreshToken', result.refreshToken);
      router.replace('/(tabs)');
    } catch (error) {
      if (error instanceof AuthApiError) {
        if (error.code === 'AUTH4011') {
          setErrorMessage('아이디 또는 비밀번호가 올바르지 않아요');
        } else if (error.code === 'AUTH4031') {
          setErrorMessage('탈퇴한 계정이에요');
        } else if (error.code === 'AUTH4293') {
          setErrorMessage('로그인 시도가 너무 많아요. 잠시 후 다시 시도해주세요');
        } else {
          setErrorMessage('로그인 중 오류가 발생했어요. 다시 시도해주세요.');
        }
      } else {
        setErrorMessage('네트워크 오류가 발생했어요. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

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

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <PrimaryButton
          label={loading ? '로그인 중...' : '로그인'}
          onPress={handleLogin}
          disabled={!id || !password || loading}
        />

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
  errorText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.red,
    textAlign: 'center',
  },
});
