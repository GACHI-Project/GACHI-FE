import { View, Text, StyleSheet } from 'react-native';
import fonts from '../../constants/fonts';
import colors from '../../constants/colors';

interface PasswordStrengthBarProps {
  password: string;
}

const STRENGTH_COLORS = ['#E53935', '#FFA726', '#66BB6A', '#2E7D32'];
const STRENGTH_LABELS = ['위험', '보통', '안전', '매우 안전'];
const SEGMENT_KEYS = ['s1', 's2', 's3', 's4'];

export const getStrength = (password: string): number => {
  if (!password) return 0;

  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const typeCount = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length;

  if (typeCount <= 1) return 1;

  let lengthScore = 0;
  if (password.length >= 16) lengthScore = 3;
  else if (password.length >= 12) lengthScore = 2;
  else if (password.length >= 10) lengthScore = 1;
  const typeScore = typeCount === 3 ? 2 : 1;
  const total = lengthScore + typeScore;

  if (total <= 1) return 1;
  if (total <= 3) return 2;
  if (total === 4) return 3;
  return 4;
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
