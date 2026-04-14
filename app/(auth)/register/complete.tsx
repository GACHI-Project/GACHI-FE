import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import ConfettiCannon from 'react-native-confetti-cannon';
import { PrimaryButton } from '../../../src/components/common/Button';
import colors from '../../../src/constants/colors';
import fonts from '../../../src/constants/fonts';
import layout from '../../../src/constants/layout';

// ─── 메인 화면 ────────────────────────────────────────────────────────────────

const RegisterCompleteScreen = () => {
  const confettiRef = useRef<React.ComponentRef<typeof ConfettiCannon>>(null);

  useEffect(() => {
    if (confettiRef.current) {
      confettiRef.current.start();
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.outerCircleWrapper}>
          <Svg width={150} height={150} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="outerGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="30%" stopColor="#4DA3FF" stopOpacity="1" />
                <Stop offset="60%" stopColor="#5BAAFF" stopOpacity="0.65" />
                <Stop offset="80%" stopColor="#8AC8FF" stopOpacity="0.28" />
                <Stop offset="90%" stopColor="#B0D9FF" stopOpacity="0.08" />
                <Stop offset="100%" stopColor="#C1ECFC" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="75" cy="75" r="75" fill="url(#outerGrad)" />
          </Svg>
          <View style={styles.innerCircle}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        </View>

        {/* 텍스트 */}
        <View style={styles.textSection}>
          <Text style={styles.title}>가입이 완료됐어요!</Text>
          <Text style={styles.subtitle}>
            이제 가치와 함께 우리 아이의 학교 생활을 더 쉽게 알아가요
          </Text>
        </View>

        {/* 버튼 */}
        <View style={styles.buttonWrapper}>
          <PrimaryButton
            label="로그인하러 가기 →"
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
      </View>

      {/* 컨페티 */}
      <ConfettiCannon
        ref={confettiRef}
        count={150}
        origin={{ x: layout.screenPaddingHorizontal * 9, y: -10 }}
        colors={[
          colors.secondary[500],
          colors.primary[400],
          colors.secondary[600],
          colors.primary[300],
        ]}
        autoStart={false}
        explosionSpeed={800}
        fadeOut
      />
    </View>
  );
};

export default RegisterCompleteScreen;

// ─── 스타일 ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  outerCircleWrapper: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 64,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
    lineHeight: 72,
  },
  textSection: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonWrapper: {
    alignSelf: 'stretch',
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
});
