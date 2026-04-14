import { useState } from 'react';
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
  childColor: string;
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
    childColor: '#26DE81',
    description: '담임 선생님께 오늘까지',
  },
  {
    id: '2',
    title: '학부모 상담 신청',
    childName: '둘째',
    childColor: '#FFCC2F',
    description: '오늘까지 상담 시간 신청',
  },
];

const today = new Date();
const todayMonth = today.toLocaleString('en-US', { month: 'short' }).toUpperCase();
const todayDay = today.getDate();

const TaskCard = () => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

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
          <Text style={styles.summaryTitle}>오늘 처리할 항목 3건</Text>
          <Text style={styles.summaryDesc}>첫째 2건 · 둘째 1건 남아 있어요</Text>
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
      {TODO_ITEMS.map((item, index) => (
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
                <View style={[styles.childTag, { backgroundColor: item.childColor }]}>
                  <Text style={styles.childTagText}>{item.childName}</Text>
                </View>
                <Text style={styles.todoDesc}>{item.description}</Text>
              </View>
            </View>
            <View style={styles.todayBadge}>
              <Text style={styles.todayText}>오늘</Text>
            </View>
          </View>
          {index < TODO_ITEMS.length - 1 && <View style={styles.divider} />}
        </View>
      ))}

      <View style={styles.divider} />

      <TouchableOpacity
        style={styles.moreButton}
        activeOpacity={0.7}
        onPress={() => router.push('/(tabs)/calendar')}
      >
        <Text style={styles.moreText}>1개 더보기 →</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TaskCard;
