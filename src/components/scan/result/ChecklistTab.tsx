import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getNewsletterChecklist, NewsletterApiError } from '../../../api/newsletter';
import type { ChecklistItem } from '../../../api/newsletter';
import colors from '../../../constants/colors';
import fonts from '../../../constants/fonts';

interface Props {
  newsletterId?: number;
}

const ChecklistTab = ({ newsletterId }: Props) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setItems([]);

    if (!newsletterId) {
      setError('가정통신문 정보를 찾을 수 없어요.');
      setLoading(false);
      return () => {};
    }

    let cancelled = false;

    getNewsletterChecklist(newsletterId, 'CHECKLIST')
      .then((result) => {
        if (!cancelled) setItems(result);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof NewsletterApiError && e.code === 'NL4041') {
          setError('가정통신문을 찾을 수 없어요.');
        } else {
          setError('체크리스트를 불러오는 데 실패했어요.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [newsletterId]);

  const toggle = (id: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.checklistId === id ? { ...item, isCompleted: !item.isCompleted } : item
      )
    );
  };

  const remove = (id: number) => {
    setItems((prev) => prev.filter((item) => item.checklistId !== id));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary[400]} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>체크리스트 항목이 없어요.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item.checklistId} style={[styles.card, item.isCompleted && styles.cardChecked]}>
          <TouchableOpacity
            style={[styles.checkbox, item.isCompleted && styles.checkboxChecked]}
            onPress={() => toggle(item.checklistId)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.isCompleted }}
          >
            {item.isCompleted && <Ionicons name="checkmark" size={14} color={colors.text.white} />}
          </TouchableOpacity>

          <View style={styles.textBlock}>
            <Text style={[styles.title, item.isCompleted && styles.titleChecked]}>
              {item.content}
            </Text>
            {item.detail && <Text style={styles.subtitle}>{item.detail}</Text>}
          </View>

          {item.isCompleted ? (
            <TouchableOpacity
              onPress={() => remove(item.checklistId)}
              accessibilityLabel="항목 삭제"
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={20} color={colors.primary[500]} />
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
    </View>
  );
};

export default ChecklistTab;

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  centered: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
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
