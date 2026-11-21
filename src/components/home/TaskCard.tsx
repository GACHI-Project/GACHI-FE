import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { getTodayChecklists } from '../../api/checklist';
import colors from '../../constants/colors';
import useCurrentDate from '../../hooks/useCurrentDate';
import { changeChecklist } from '../../query/checklists';
import { useApiMutation, useServerQuery } from '../../query/hooks';
import { useChildrenQuery } from '../../query/resources';
import styles from './taskCard.styles';
import TodoItem from './TodoItem';

const VISIBLE_COUNT = 2;

const TaskCard = () => {
  const { t } = useTranslation();
  const today = useCurrentDate();
  const query = useServerQuery('today', [today], (signal) => getTodayChecklists(signal));
  const { data: children = [] } = useChildrenQuery();
  const items = useMemo(() => query.data ?? [], [query.data]);
  const loading = query.isLoading;
  const error = query.isError;
  const mutate = useApiMutation(changeChecklist);
  const [pendingIds, setPendingIds] = useState<Record<number, boolean>>({});
  const checked = Object.fromEntries(items.map((item) => [item.checklistId, item.isCompleted]));

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    children.forEach((c) => {
      map[c.name] = c.colorCode;
    });
    return map;
  }, [children]);

  const total = items.length;
  const visibleItems = items.slice(0, VISIBLE_COUNT);
  const hiddenCount = Math.max(total - VISIBLE_COUNT, 0);

  const distinctChildNames = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    items.forEach((item) => {
      if (!seen.has(item.childName)) {
        seen.add(item.childName);
        result.push(item.childName);
      }
    });
    return result;
  }, [items]);

  const summaryDesc = useMemo(() => {
    if (total === 0) return t('home.taskCard.todayEmpty');
    const grouped: Record<string, number> = {};
    items.forEach((item) => {
      grouped[item.childName] = (grouped[item.childName] ?? 0) + 1;
    });
    return `${Object.entries(grouped)
      .map(([name, count]) => t('home.taskCard.childCount', { name, count }))
      .join(' · ')} ${t('home.taskCard.remaining')}`;
  }, [items, t, total]);

  const { todayMonth, todayDay } = useMemo(() => {
    const now = new Date(`${today}T12:00:00`);
    return {
      todayMonth: now.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
      todayDay: now.getDate(),
    };
  }, [today]);

  const toggleCheck = (id: number, currentChecked: boolean) => {
    if (pendingIds[id]) return;
    setPendingIds((previous) => ({ ...previous, [id]: true }));
    void mutate(id, currentChecked, !currentChecked)
      .catch(() => {})
      .finally(() => {
        setPendingIds((previous) => ({ ...previous, [id]: false }));
      });
  };

  const summaryTitle = (() => {
    if (loading || error) return '';
    if (total === 0) return t('home.taskCard.noTodo');
    return t('home.taskCard.todayCount', { count: total });
  })();

  const renderBody = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={colors.primary[400]}
          style={styles.loadingIndicator}
        />
      );
    }
    if (error) return <Text style={styles.emptyText}>{t('common.networkError')}</Text>;
    if (total === 0) return <Text style={styles.emptyText}>{t('home.taskCard.empty')}</Text>;
    return visibleItems.map((item, index) => (
      <TodoItem
        key={item.checklistId}
        item={item}
        isChecked={!!checked[item.checklistId]}
        isPending={!!pendingIds[item.checklistId]}
        childColor={colorMap[item.childName] ?? colors.primary[300]}
        showDivider={index < visibleItems.length - 1}
        onToggle={toggleCheck}
      />
    ));
  };

  return (
    <View style={styles.card}>
      <View style={styles.summaryRow}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateMonth} numberOfLines={1}>
            {todayMonth}
          </Text>
          <Text style={styles.dateDay} numberOfLines={1}>
            {todayDay}
          </Text>
        </View>
        <View style={styles.summaryTexts}>
          <Text style={styles.summaryTitle}>{summaryTitle}</Text>
          {!loading && !error && <Text style={styles.summaryDesc}>{summaryDesc}</Text>}
        </View>
        {distinctChildNames.length > 0 && (
          <View style={styles.childCircles}>
            {distinctChildNames.map((name, index) => (
              <View
                key={name}
                style={[
                  styles.childCircle,
                  { backgroundColor: colorMap[name] ?? colors.primary[300] },
                  index > 0 && styles.childCircleOverlap,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {renderBody()}

      {hiddenCount > 0 && (
        <>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.moreButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('home.taskCard.moreItems', { count: hiddenCount })}
            onPress={() => router.push('/(tabs)/calendar')}
          >
            <Text style={styles.moreText}>
              {t('home.taskCard.moreItems', { count: hiddenCount })}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default TaskCard;
