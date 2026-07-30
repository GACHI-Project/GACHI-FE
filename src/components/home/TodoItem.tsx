import { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TodayChecklistItem } from '../../api/checklist';
import styles from './taskCard.styles';

interface Props {
  item: TodayChecklistItem;
  isChecked: boolean;
  isPending: boolean;
  childColor: string;
  showDivider: boolean;
  onToggle: (id: number, currentChecked: boolean) => void;
}

const TodoItem = memo(
  ({ item, isChecked, isPending, childColor, showDivider, onToggle }: Props) => {
    const { t } = useTranslation();
    return (
      <View>
        <View style={styles.todoRow}>
          <TouchableOpacity
            style={[styles.checkbox, isChecked && styles.checkboxChecked]}
            onPress={() => onToggle(item.checklistId, isChecked)}
            activeOpacity={0.7}
            disabled={isPending}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isChecked, busy: isPending }}
            accessibilityLabel={item.content}
          >
            {isChecked && (
              <Text style={styles.checkMark} allowFontScaling={false}>
                ✓
              </Text>
            )}
          </TouchableOpacity>
          <View style={styles.todoContent}>
            <Text style={[styles.todoTitle, isChecked && styles.todoTitleDone]} numberOfLines={2}>
              {item.content}
            </Text>
            <View style={styles.todoMeta}>
              <View style={[styles.childTag, { backgroundColor: childColor }]}>
                <Text style={styles.childTagText} numberOfLines={1}>
                  {item.childName}
                </Text>
              </View>
              {item.detail ? (
                <Text style={styles.todoDesc} numberOfLines={1}>
                  {item.detail}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.todayBadge}>
            <Text style={styles.todayText} numberOfLines={1}>
              {t('home.taskCard.today')}
            </Text>
          </View>
        </View>
        {showDivider && <View style={styles.divider} />}
      </View>
    );
  }
);

export default TodoItem;
