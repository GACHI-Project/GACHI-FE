import { View, Text, StyleSheet } from 'react-native';
import colors from '../../src/constants/colors';
import fonts from '../../src/constants/fonts';

const CalendarScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>calendar</Text>
  </View>
);

export default CalendarScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text.white,
  },
  text: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
});
