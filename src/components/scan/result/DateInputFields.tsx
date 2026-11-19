import { memo } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import styles from './styles';
import useResponsiveLayout from '../../../hooks/useResponsiveLayout';

interface Props {
  year: string;
  month: string;
  day: string;
  onYearChange: (v: string) => void;
  onMonthChange: (v: string) => void;
  onDayChange: (v: string) => void;
}

const DateInputFields = memo(
  ({ year, month, day, onYearChange, onMonthChange, onDayChange }: Props) => {
    const { t } = useTranslation();
    const { isCompact } = useResponsiveLayout();
    const fieldStyle = [styles.dateInputWrap, isCompact && styles.dateInputFullWidth];
    return (
      <View style={styles.dateInputRow}>
        <View style={fieldStyle}>
          <Text style={styles.dateUnit}>{t('scan.result.saveBottomSheet.year')}</Text>
          <TextInput
            style={styles.dateInput}
            value={year}
            onChangeText={onYearChange}
            keyboardType="number-pad"
            maxLength={4}
            accessibilityLabel={t('scan.result.saveBottomSheet.yearLabel')}
          />
        </View>
        <View style={fieldStyle}>
          <Text style={styles.dateUnit}>{t('scan.result.saveBottomSheet.month')}</Text>
          <TextInput
            style={styles.dateInput}
            value={month}
            onChangeText={onMonthChange}
            keyboardType="number-pad"
            maxLength={2}
            accessibilityLabel={t('scan.result.saveBottomSheet.monthLabel')}
          />
        </View>
        <View style={fieldStyle}>
          <Text style={styles.dateUnit}>{t('scan.result.saveBottomSheet.day')}</Text>
          <TextInput
            style={styles.dateInput}
            value={day}
            onChangeText={onDayChange}
            keyboardType="number-pad"
            maxLength={2}
            accessibilityLabel={t('scan.result.saveBottomSheet.dayLabel')}
          />
        </View>
      </View>
    );
  }
);

export default DateInputFields;
