import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  getTodayChecklists,
  toggleChecklistItem,
  type TodayChecklistItem,
} from '../../api/checklist';
import { getMyChildren, type ChildResult } from '../../api/child';
import colors from '../../constants/colors';
import styles from '../../styles/home/taskCard';

const VISIBLE_COUNT = 2;

const TaskCard = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<TodayChecklistItem[]>([]);
  const [children, setChildren] = useState<ChildResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [pendingIds, setPendingIds] = useState<Record<number, boolean>>({});
  const [focusKey, setFocusKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setFocusKey((k) => k + 1);
      setChecked({});
      setPendingIds({});
    }, [])
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    Promise.all([getTodayChecklists(), getMyChildren()])
      .then(([checklists, childList]) => {
        if (!cancelled) {
          setItems(checklists);
          setChildren(childList);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [focusKey]);

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
    const now = new Date();
    return {
      todayMonth: now.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
      todayDay: now.getDate(),
    };
  }, []);

  const toggleCheck = useCallback(
    (id: number, currentChecked: boolean) => {
      if (pendingIds[id]) return;
      const next = !currentChecked;
      setChecked((prev) => ({ ...prev, [id]: next }));
      setPendingIds((prev) => ({ ...prev, [id]: true }));
      toggleChecklistItem(id, next)
        .catch(() => {
          setChecked((prev) => ({ ...prev, [id]: !next }));
        })
        .finally(() => {
          setPendingIds((prev) => ({ ...prev, [id]: false }));
        });
    },
    [pendingIds]
  );

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
      <View key={item.checklistId}>
        <View style={styles.todoRow}>
          <TouchableOpacity
            style={[styles.checkbox, checked[item.checklistId] && styles.checkboxChecked]}
            onPress={() => toggleCheck(item.checklistId, !!checked[item.checklistId])}
            activeOpacity={0.7}
            disabled={!!pendingIds[item.checklistId]}
            accessibilityRole="checkbox"
            accessibilityState={{
              checked: !!checked[item.checklistId],
              busy: !!pendingIds[item.checklistId],
            }}
            accessibilityLabel={item.content}
          >
            {checked[item.checklistId] && (
              <Text style={styles.checkMark} allowFontScaling={false}>
                ✓
              </Text>
            )}
          </TouchableOpacity>
          <View style={styles.todoContent}>
            <Text
              style={[styles.todoTitle, checked[item.checklistId] && styles.todoTitleDone]}
              numberOfLines={2}
            >
              {item.content}
            </Text>
            <View style={styles.todoMeta}>
              <View
                style={[
                  styles.childTag,
                  { backgroundColor: colorMap[item.childName] ?? colors.primary[300] },
                ]}
              >
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
        {index < visibleItems.length - 1 && <View style={styles.divider} />}
      </View>
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
          <Text style={styles.summaryTitle} numberOfLines={1}>
            {summaryTitle}
          </Text>
          {!loading && !error && (
            <Text style={styles.summaryDesc} numberOfLines={2}>
              {summaryDesc}
            </Text>
          )}
        </View>
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
