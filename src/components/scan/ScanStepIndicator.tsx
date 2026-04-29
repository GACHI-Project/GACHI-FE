import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';

interface ScanStepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

const ScanStepIndicator = ({ currentStep, totalSteps = 4 }: ScanStepIndicatorProps) => (
  <View style={styles.container}>
    {Array.from({ length: totalSteps }, (_, i) => {
      const step = i + 1;
      const isCompleted = step < currentStep;
      const isActive = step === currentStep;
      return (
        <View key={step} style={styles.item}>
          {i > 0 && <View style={[styles.line, isCompleted && styles.lineActive]} />}
          <View style={isActive ? styles.activeRing : styles.ringPlaceholder}>
            <View
              style={[
                styles.circle,
                isCompleted && styles.circleCompleted,
                isActive && styles.circleActive,
              ]}
            >
              {isCompleted ? (
                <Ionicons name="checkmark" size={13} color={colors.text.white} />
              ) : (
                <Text style={styles.number}>{step}</Text>
              )}
            </View>
          </View>
        </View>
      );
    })}
  </View>
);

export default ScanStepIndicator;

const CIRCLE_SIZE = 24;
const RING_SIZE = CIRCLE_SIZE + 8;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: 28,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    width: 52,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary[100],
  },
  lineActive: {
    backgroundColor: colors.primary[400],
  },
  ringPlaceholder: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary[400],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 12,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.primary[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    backgroundColor: colors.primary[400],
  },
  circleActive: {
    backgroundColor: colors.primary[400],
  },
  number: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
  },
});
