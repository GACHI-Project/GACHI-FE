import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import colors from '../../constants/colors';
import layout from '../../constants/layout';
import fonts from '../../constants/fonts';

interface StepHeaderProps {
  currentStep: number;
  totalStep: number;
}

const StepHeader = ({ currentStep, totalStep }: StepHeaderProps) => {
  const { t } = useTranslation();
  const progress = totalStep > 0 ? Math.min((currentStep / totalStep) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        accessible
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <Ionicons name="chevron-back" size={18} color={colors.gray[300]} />
      </TouchableOpacity>

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.stepText}>
          {t('stepHeader.step', { current: currentStep, total: totalStep })}
        </Text>
      </View>
    </View>
  );
};

export default StepHeader;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray[200],
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary[500],
  },
  stepText: {
    fontSize: 12,
    color: colors.primary[600],
    fontFamily: fonts.semiBold,
    minWidth: 60,
    textAlign: 'right',
  },
});
