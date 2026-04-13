import { View, Text, StyleSheet } from 'react-native';
import fonts from '../../constants/fonts';
import colors from '../../constants/colors';

interface PasswordStrengthBarProps {
  password: string;
}

const SEGMENT_COUNT = 4;
const STRENGTH_COLORS = ['#E53935', '#FFC107', '#66BB6A', '#2E7D32'];
const STRENGTH_LABELS = ['약함', '보통', '강력', '매우 강력'];
const SEGMENT_KEYS = ['s1', 's2', 's3', 's4'];

export const getStrength = (password: string): number => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Za-z]/.test(password) && /[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(Math.max(score, 1), SEGMENT_COUNT);
};

const PasswordStrengthBar = ({ password }: PasswordStrengthBarProps) => {
  const strength = getStrength(password);
  const show = password.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.segments}>
        {SEGMENT_KEYS.map((key, i) => (
          <View
            key={key}
            style={[
              styles.segment,
              {
                backgroundColor:
                  show && i < strength ? STRENGTH_COLORS[strength - 1] : colors.gray[200],
              },
            ]}
          />
        ))}
      </View>
      {show && (
        <Text style={[styles.label, { color: STRENGTH_COLORS[strength - 1] }]}>
          보안 강도 : {STRENGTH_LABELS[strength - 1]}
        </Text>
      )}
    </View>
  );
};

export default PasswordStrengthBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  segments: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.medium,
  },
});
