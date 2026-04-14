import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import { router } from 'expo-router';

const ScanBanner = () => (
  <View style={styles.banner}>
    <View style={styles.iconWrapper}>
      <Ionicons name="scan-outline" size={28} color={colors.text.white} />
    </View>
    <View style={styles.texts}>
      <Text style={styles.title}>가정통신문 스캔하기</Text>
      <Text style={styles.desc}>찍기만 하면 번역 · 요약 · 체크리스트까지 한 번에</Text>
    </View>
    <TouchableOpacity style={styles.button} activeOpacity={0.8}>
      <Text style={styles.buttonText} onPress={() => router.push('/(tabs)/scan')}>
        지금 스캔 →
      </Text>
    </TouchableOpacity>
  </View>
);

export default ScanBanner;

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary[200],
    borderRadius: 15,
    padding: 15,
    gap: 15,
  },
  iconWrapper: {
    width: 45,
    height: 45,
    borderRadius: 8,
    backgroundColor: colors.secondary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  desc: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  button: {
    backgroundColor: colors.text.white,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  buttonText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
});
