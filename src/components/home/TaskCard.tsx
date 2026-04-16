import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import styles from '../../styles/home/taskCard';

interface Child {
  id: string;
  color: string;
}

interface TodoItem {
  id: string;
  title: string;
  childName: string;
  childId: string;
  description: string;
}

const CHILDREN: Child[] = [
  { id: '1', color: '#26DE81' },
  { id: '2', color: '#FFCC2F' },
];

const TODO_ITEMS: TodoItem[] = [
  {
    id: '1',
    title: '현장학습 동의서 제출',
    childName: '첫째',
    childId: '1',
    description: '담임 선생님께 오늘까지',
  },
  {
    id: '2',
    title: '학부모 상담 신청',
    childName: '둘째',
    childId: '2',
    description: '오늘까지 상담 시간 신청',
  },
];

const VISIBLE_COUNT = 2;
const total = TODO_ITEMS.length;
const visibleItems = TODO_ITEMS.slice(0, VISIBLE_COUNT);
const hiddenCount = Math.max(total - VISIBLE_COUNT, 0);
const summaryDesc = (() => {
  if (total === 0) return '오늘 처리할 항목이 없어요';
  const childCounts = CHILDREN.map((child) => ({
    name: TODO_ITEMS.find((t) => t.childId === child.id)?.childName ?? '',
    count: TODO_ITEMS.filter((t) => t.childId === child.id).length,
  }));
  return `${childCounts
    .filter((c) => c.count > 0)
    .map((c) => `${c.name} ${c.count}건`)
    .join(' · ')} 남아 있어요`;
})();

const TaskCard = () => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const { todayMonth, todayDay } = useMemo(() => {
    const now = new Date();
    return {
      todayMonth: now.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
      todayDay: now.getDate(),
    };
  }, []);

  const toggleCheck = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <View style={styles.card}>
      {/* Summary row */}
      <View style={styles.summaryRow}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateMonth}>{todayMonth}</Text>
          <Text style={styles.dateDay}>{todayDay}</Text>
        </View>
        <View style={styles.summaryTexts}>
          <Text style={styles.summaryTitle}>
            {total === 0 ? '오늘 할 일 없음' : `오늘 처리할 항목 ${total}건`}
          </Text>
          <Text style={styles.summaryDesc}>{summaryDesc}</Text>
        </View>
        <View style={styles.childCircles}>
          {CHILDREN.map((child, index) => (
            <View
              key={child.id}
              style={[
                styles.childCircle,
                { backgroundColor: child.color },
                index > 0 && styles.childCircleOverlap,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Todo items */}
      {total === 0 ? (
        <Text style={styles.emptyText}>오늘은 처리할 항목이 없어요 🎉</Text>
      ) : (
        visibleItems.map((item, index) => (
          <View key={item.id}>
            <View style={styles.todoRow}>
              <TouchableOpacity
                style={[styles.checkbox, checked[item.id] && styles.checkboxChecked]}
                onPress={() => toggleCheck(item.id)}
                activeOpacity={0.7}
              >
                {checked[item.id] && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
              <View style={styles.todoContent}>
                <Text style={[styles.todoTitle, checked[item.id] && styles.todoTitleDone]}>
                  {item.title}
                </Text>
                <View style={styles.todoMeta}>
                  <View
                    style={[
                      styles.childTag,
                      { backgroundColor: CHILDREN.find((c) => c.id === item.childId)?.color },
                    ]}
                  >
                    <Text style={styles.childTagText}>{item.childName}</Text>
                  </View>
                  <Text style={styles.todoDesc}>{item.description}</Text>
                </View>
              </View>
              <View style={styles.todayBadge}>
                <Text style={styles.todayText}>오늘</Text>
              </View>
            </View>
            {index < visibleItems.length - 1 && <View style={styles.divider} />}
          </View>
        ))
      )}

      {hiddenCount > 0 && (
        <>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.moreButton}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/calendar')}
          >
            <Text style={styles.moreText}>{hiddenCount}개 더보기 →</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default TaskCard;
