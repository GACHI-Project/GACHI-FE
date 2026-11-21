import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

interface Props {
  message?: string;
  loading?: boolean;
  retrying?: boolean;
  onRetry?: () => void;
}

const QueryNotice = ({ message, loading, retrying, onRetry }: Props) => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      {(loading || retrying) && <ActivityIndicator color={colors.primary[400]} />}
      {(!loading || message) && (
        <Text style={styles.message} accessibilityLiveRegion="polite">
          {message ?? t('common.networkError')}
        </Text>
      )}
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          disabled={loading || retrying}
          accessibilityRole="button"
          style={styles.retry}
        >
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default QueryNotice;

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 12, gap: 8 },
  message: { color: colors.text.secondary, fontFamily: fonts.medium, textAlign: 'center' },
  retry: { padding: 10 },
  retryText: { color: colors.primary[400], fontFamily: fonts.medium },
});
