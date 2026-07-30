import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ChecklistItem } from '../../../api/newsletter';
import colors from '../../../constants/colors';
import fonts from '../../../constants/fonts';

interface Props {
  item: ChecklistItem;
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
}

const ChecklistItemRow = memo(({ item, onToggle, onRemove }: Props) => {
  const { t } = useTranslation();
  return (
    <View style={[styles.card, item.isCompleted && styles.cardChecked]}>
      <TouchableOpacity
        style={[styles.checkbox, item.isCompleted && styles.checkboxChecked]}
        onPress={() => onToggle(item.checklistId)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.isCompleted }}
      >
        {item.isCompleted && <Ionicons name="checkmark" size={14} color={colors.text.white} />}
      </TouchableOpacity>

      <View style={styles.textBlock}>
        <Text style={[styles.title, item.isCompleted && styles.titleChecked]}>{item.content}</Text>
        {item.detail && <Text style={styles.subtitle}>{item.detail}</Text>}
      </View>

      {item.isCompleted && (
        <TouchableOpacity
          onPress={() => onRemove(item.checklistId)}
          accessibilityLabel={t('scan.result.checklist.deleteItem')}
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={20} color={colors.primary[500]} />
        </TouchableOpacity>
      )}
    </View>
  );
});

export default ChecklistItemRow;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: colors.text.white,
    borderRadius: 16,
    padding: 18,
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardChecked: {
    backgroundColor: colors.gray[100],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.primary[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: colors.primary[400],
    borderColor: colors.primary[400],
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  titleChecked: {
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
});
