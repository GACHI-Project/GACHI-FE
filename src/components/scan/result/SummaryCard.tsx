import { ReactNode, ComponentProps } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../constants/colors';
import fonts from '../../../constants/fonts';

interface Props {
  icon: ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  title: string;
  children: ReactNode;
}

const SummaryCard = ({ icon, iconBg, title, children }: Props) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={colors.text.white} />
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
    {children}
  </View>
);

export default SummaryCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.text.white,
    borderRadius: 20,
    padding: 20,
    gap: 8,
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
});
