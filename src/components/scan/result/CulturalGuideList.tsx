import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import type { CulturalGuide } from '../../../api/newsletter';
import colors from '../../../constants/colors';
import fonts from '../../../constants/fonts';

interface Props {
  loading: boolean;
  guides: CulturalGuide[];
}

const CulturalGuideList = ({ loading, guides }: Props) => {
  if (loading) return <ActivityIndicator size="small" color={colors.primary[400]} />;
  return (
    <View style={styles.qnaList}>
      {guides.map((guide) => (
        <View key={guide.faqId} style={styles.qnaItem}>
          <View style={styles.qnaRow}>
            <Text style={styles.qLabel}>Q.</Text>
            <Text style={styles.qText}>{guide.question}</Text>
          </View>
          <View style={styles.qnaRow}>
            <Text style={styles.aLabel}>A.</Text>
            <Text style={styles.aText}>{guide.answer}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default CulturalGuideList;

const styles = StyleSheet.create({
  qnaList: {
    gap: 16,
  },
  qnaItem: {
    gap: 6,
  },
  qnaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  qLabel: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.primary[500],
    minWidth: 18,
  },
  aLabel: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text.secondary,
    minWidth: 18,
  },
  qText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
    lineHeight: 22,
  },
  aText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    lineHeight: 22,
  },
});
