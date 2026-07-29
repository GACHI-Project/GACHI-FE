import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

interface Props {
  loading?: boolean;
  message?: string;
}

const CenteredMessage = ({ loading, message }: Props) => (
  <View style={styles.centered}>
    {loading ? (
      <ActivityIndicator size="large" color={colors.primary[400]} />
    ) : (
      <Text style={styles.text}>{message}</Text>
    )}
  </View>
);

export default CenteredMessage;

const styles = StyleSheet.create({
  centered: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
});
