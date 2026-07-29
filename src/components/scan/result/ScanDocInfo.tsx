import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../constants/colors';
import styles from '../../../styles/scan/result';

interface Props {
  loading: boolean;
  title: string;
  date: string;
  childName: string;
  childGrade?: string;
}

const ScanDocInfo = ({ loading, title, date, childName, childGrade }: Props) => (
  <View style={styles.docInfo}>
    {loading ? (
      <ActivityIndicator size="small" color={colors.primary[400]} />
    ) : (
      <>
        <Text style={styles.docTitle} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.metaRow}>
          {date ? (
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={13} color={colors.text.secondary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {date}
              </Text>
            </View>
          ) : null}
          {childName || childGrade ? (
            <View style={styles.metaItem}>
              <Ionicons name="school" size={13} color={colors.text.secondary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {childName}
                {childName && childGrade ? ' · ' : ''}
                {childGrade ?? ''}
              </Text>
            </View>
          ) : null}
        </View>
      </>
    )}
  </View>
);

export default ScanDocInfo;
