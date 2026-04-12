import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import StepHeader from '../../../src/components/common/StepHeader';
import { PrimaryButton, SecondaryButton } from '../../../src/components/common/Button';
import layout from '../../../src/constants/layout';

const RegisterBasicScreen = () => (
  <View style={styles.container}>
    <StepHeader currentStep={1} totalStep={4} />

    <View style={styles.content}>{/* 폼 영역 */}</View>

    <View style={styles.footer}>
      <PrimaryButton label="다음으로 →" onPress={() => router.push('/(auth)/register/child')} />
      <SecondaryButton
        label="나중에 설정할게요"
        onPress={() => router.push('/(auth)/register/child')}
      />
    </View>
  </View>
);

export default RegisterBasicScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: layout.screenPaddingTop,
  },
  footer: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: layout.screenPaddingBottom,
    gap: 10,
  },
});
