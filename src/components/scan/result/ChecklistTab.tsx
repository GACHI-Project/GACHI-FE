import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../constants/colors';
import fonts from '../../../constants/fonts';

interface ChecklistItem {
  id: string;
  title: string;
  subtitle: string;
  deadline?: string;
  checked: boolean;
}

const MOCK_ITEMS: ChecklistItem[] = [
  {
    id: '1',
    title: '현장학습 동의서 제출',
    subtitle: '담임 선생님께 원본 직접 제출',
    deadline: '내일 마감',
    checked: false,
  },
  {
    id: '2',
    title: '알레르기 없는 도시락 준비',
    subtitle: '해산물, 견과류 포함 금지',
    deadline: '내일 마감',
    checked: false,
  },
  {
    id: '3',
    title: '봄 현장학습 안내문 읽기',
    subtitle: 'AI 번역 완료',
    deadline: '오늘 마감',
    checked: true,
  },
  {
    id: '4',
    title: '현장학습 동의서 제출',
    subtitle: '담임 선생님께 원본 직접 제출',
    deadline: '내일 마감',
    checked: false,
  },
];

export default function ChecklistTab() {
  const [items, setItems] = useState<ChecklistItem[]>(MOCK_ITEMS);

  const toggle = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item.id} style={[styles.card, item.checked && styles.cardChecked]}>
          <TouchableOpacity
            style={[styles.checkbox, item.checked && styles.checkboxChecked]}
            onPress={() => toggle(item.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.checked }}
          >
            {item.checked && <Ionicons name="checkmark" size={14} color={colors.text.white} />}
          </TouchableOpacity>

          <View style={styles.textBlock}>
            <Text style={[styles.title, item.checked && styles.titleChecked]}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>

          {item.checked ? (
            <TouchableOpacity
              onPress={() => remove(item.id)}
              accessibilityLabel="항목 삭제"
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={20} color={colors.primary[500]} />
            </TouchableOpacity>
          ) : item.deadline ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.deadline}</Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  cardChecked: {
    backgroundColor: colors.gray[100],
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
  badge: {
    backgroundColor: colors.secondary[600],
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
  },
});
