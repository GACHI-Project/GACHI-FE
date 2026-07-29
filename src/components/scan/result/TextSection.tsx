import { View, Text, StyleSheet } from 'react-native';
import colors from '../../../constants/colors';
import fonts from '../../../constants/fonts';

interface Props {
  label: string;
  text: string;
}

const TextSection = ({ label, text }: Props) => (
  <View style={styles.section}>
    <Text style={styles.sectionLabel}>{label}</Text>
    <View style={styles.card}>
      <Text style={styles.bodyText}>{text}</Text>
    </View>
  </View>
);

export default TextSection;

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  card: {
    borderRadius: 16,
    backgroundColor: colors.text.white,
    padding: 16,
    shadowColor: colors.gray[300],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  bodyText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.primary,
    lineHeight: 22,
  },
});
