import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  onHelp?: () => void;
}

const Header = ({ title, onBack, onHelp }: HeaderProps) => (
  <View style={styles.container}>
    <TouchableOpacity
      style={styles.iconButton}
      onPress={onBack ?? (() => router.back())}
      accessibilityRole="button"
      accessibilityLabel="뒤로 가기"
    >
      <Ionicons name="arrow-back" size={16} color={colors.gray[300]} />
    </TouchableOpacity>
    <Text style={styles.title}>{title}</Text>
    {onHelp ? (
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onHelp}
        accessibilityRole="button"
        accessibilityLabel="도움말"
      >
        <Ionicons name="help" size={16} color={colors.gray[300]} />
      </TouchableOpacity>
    ) : (
      <View style={styles.iconSpacer} />
    )}
  </View>
);

export default Header;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: 32,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  iconSpacer: {
    width: 30,
    height: 30,
  },
});
